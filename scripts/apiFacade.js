import { config } from './config/config.js';
import { sleep, filterCurrenciesWhitelist } from './misc.js';
import { toISODate, checkISODateValidity, getDateRange } from './ISODataParser.js';
import { ArgumentError } from './errors.js';

/**
 * Normalizes and validates a base currency code for rate URLs (lowercase ISO 4217, three letters).
 *
 * @param {unknown} currencyCode
 * @returns {string} Lowercase code, e.g. `"eur"`.
 * @throws {ArgumentError} If the value is not a valid 3-letter code.
 */
function assertCurrencyCode(currencyCode) {
    if (typeof currencyCode !== "string") {
        throw new ArgumentError("Currency code must be a string.");
    }

    const normalized = currencyCode.trim().toLowerCase();
    if (!/^[a-z]{3}$/.test(normalized)) {
        throw new ArgumentError(`Invalid currency code: expected three letters (e.g. "eur"), got "${currencyCode}".`);
    }

    return normalized;
}

/**
 * Builds the currency URL for the API: optional historical date replaces `@latest`.
 *
 * @param {string} currencyCode - Base currency (ISO 4217, three letters; case-insensitive), e.g. `"eur"` or `"EUR"`.
 * @param {string|Date|undefined} [isoDate] - Optional calendar day in UTC (`YYYY-MM-DD`) or a {@link Date}; omit for latest rates.
 * @returns {string} Absolute URL ending with `/{code}.json`.
 * @throws {ArgumentError} If `currencyCode` is not a valid 3-letter code, or `isoDate` is provided but not a valid date.
 */
function buildCurrencyRatesUrl(currencyCode, isoDate) {
    const baseCurrencyCode = assertCurrencyCode(currencyCode);
    const baseURL = config.endpoints.currencyRates;

    const hasDate = isoDate != null && isoDate !== "";
    if (hasDate && !checkISODateValidity(isoDate)) {
        throw new ArgumentError("Invalid date passed to the function!");
    }

    const dateSegment = hasDate ? toISODate(isoDate) : null;
    const withDate = dateSegment ? baseURL.replace("@latest", `@${dateSegment}`) : baseURL;
    return `${withDate}/${baseCurrencyCode}.json`;
}


/**
 * Fetches the catalog of currencies (code + display name) and optionally filters rows.
*
* @param {(list: Array<{ code: string, name: string }>, context?: { excludeCode?: string }) => Array} [filterFn]
* @returns {Promise<Array<{ code: string, name: string }>>}
*/
export async function APIgetAvailableCurrencies(filterFn = filterCurrenciesWhitelist) {
    try {
        const response = await fetch(config.endpoints.currencies);

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        
        let list = Object.keys(responseData).map((elem) => ({
            code: elem,
            name: responseData[elem],
        }));
        
        let parsedData = filterFn ? filterFn(list, config.supportedCurrencies, {}) : list;
        
        return parsedData;
    }
    catch (err) {
        throw new Error(`Failed to fetch available currencies: ${err.message}`);
    }
}

/**
 * Parses the currency rate data from the API response.
 * @param {Object} data - The API response data containing date and rates.
 * @returns {Object} An object with date, baseCurrency, and ratesArr.
 */
function praseCurrencyRate(data) {
    const date = data.date;

    const [baseCurrency, ratesObj] = Object.entries(data).find(([k]) => k !== "date") ?? [];
    const ratesArr = Object.entries(ratesObj ?? {}).map(([code, value]) => ({
        code,
        value,
    }));

    return {date, baseCurrency, ratesArr};
}

/**
 * Fetches currency rates for a specific currency code and optional date.
 * @param {string} currencyCode - The base currency code (ISO 4217, three letters).
 * @param {string|Date|null} [isoDate=null] - Optional date for historical rates (YYYY-MM-DD or Date object).
 * @param {Function} [filterFn=filterCurrenciesWhitelist] - Optional filter function for the rates.
 * @returns {Promise<Object>} A promise resolving to an object with date, baseCurrency, and ratesArr.
 */
export async function APIgetCurrencyRates(currencyCode, isoDate = null, filterFn = filterCurrenciesWhitelist) {
    try {
        const response = await fetch(buildCurrencyRatesUrl(currencyCode, isoDate));

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
    
        let { date, baseCurrency, ratesArr } = praseCurrencyRate(responseData);
    
        ratesArr = filterFn ? filterFn(ratesArr, config.supportedCurrencies, { excludeCode: currencyCode }) : ratesArr;
    
        return { date, baseCurrency, ratesArr };  
    }
    catch (err) {
        throw new Error(`Failed to fetch currency rates: ${err.message}`);
    }
}

/**
 * Fetches currency rates for a range of dates with concurrency control.
 * @param {string} currencyCode - The base currency code (ISO 4217, three letters).
 * @param {Object} range - The date range object.
 * @param {string} range.startDate - The start date (YYYY-MM-DD).
 * @param {string} range.endDate - The end date (YYYY-MM-DD).
 * @param {Object} [options={ concurrency: 4, continueOnError: false }] - Options for the fetch operation.
 * @param {number} options.concurrency - Number of concurrent requests (default 4).
 * @param {boolean} options.continueOnError - Whether to continue on errors (default false).
 * @returns {Promise<Array<Object>>} A promise resolving to an array of rate objects sorted by date.
 */
export async function APIgetCurrencyRatesRange(currencyCode, range = {startDate, endDate}, options = { concurrency: 4, continueOnError: true }) {
    await sleep(2000);

    const { concurrency, continueOnError } = options
    const dateRange = getDateRange(range.startDate, range.endDate);
    const results = [];

    let idx = 0;
    const worker = async () => {
        while (idx < dateRange.length) {
            const current = dateRange[idx++];
            try {
                const { date, baseCurrency, ratesArr } = await APIgetCurrencyRates(currencyCode, current);
                results.push({ date, baseCurrency, ratesArr });
            } catch (err) {
                if (!continueOnError) throw err;
            }
        }
    };

    const poolSize = Math.max(1, Math.min(concurrency, dateRange.length));
    await Promise.all(Array.from({ length: poolSize }, worker));

    results.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return results;
}
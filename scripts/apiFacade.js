import { config } from './config/config.js';
import { withLoading, filterAvailableCurrencies, filterAvailableCurrenciesWithohutSelf, filterCertainCurrency } from './misc.js';

function toISODate(dateLike) {
    if (typeof dateLike === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;

        const d = new Date(dateLike);
        if (!Number.isFinite(d.getTime())) {
            throw new Error(`Invalid date string: ${dateLike}`);
        }
        return d.toISOString().slice(0, 10);
    }

    if (dateLike instanceof Date) {
        if (!Number.isFinite(dateLike.getTime())) throw new Error("Invalid Date");
        return dateLike.toISOString().slice(0, 10);
    }

    throw new Error(`Unsupported date value: ${String(dateLike)}`);
}

function addDaysISO(isoDate, days) {
    const d = new Date(`${isoDate}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function buildCurrencyRatesUrl(currencyCode, isoDate) {
    const base = config.endpoints.currencyRates;

    const withDate = isoDate ? base.replace("@latest", `@${isoDate}`) : base;
    return `${withDate}/${currencyCode}.json`;
}

export async function APIgetAvailableCurrencies(filterFn = filterAvailableCurrencies) {
    return withLoading(async () => {
        const response = await fetch(config.endpoints.currencies);
        const data = await response.json();
        
        let result = null;

        result = Object.keys(data).map(elem => ({
            code: elem,
            name: data[elem]
        }));

        if (filterFn) {
            result = filterFn(result);
        }

        return result;
    });
}

export async function APIgetCurrencyRates(currencyCode, filterFn = filterAvailableCurrenciesWithohutSelf) {
    return withLoading(async () => {
        const response = await fetch(buildCurrencyRatesUrl(currencyCode));
        const data = await response.json();

        const date = data.date;

        const [base, ratesObj] = Object.entries(data).find(([k]) => k !== "date") ?? [];
        let ratesArr = Object.entries(ratesObj ?? {}).map(([code, value]) => ({
            code,
            value,
        }));

        ratesArr = filterFn(ratesArr, currencyCode);

        return { date, base, ratesObj, ratesArr };
    })  
}

export async function APIgetCurrencyRatesRange(currencyCode, startDate, endDate, filterFn = filterAvailableCurrenciesWithohutSelf, options = {}) {
    const { concurrency = 4, continueOnError = false, onlyCurrencies = [] } = options ?? {};

    return withLoading(async () => {
        const startISO = toISODate(startDate);
        const endISO = toISODate(endDate);
        if (startISO > endISO) {
            throw new Error(`startDate must be <= endDate (got ${startISO} > ${endISO})`);
        }

        const dates = [];
        for (let d = startISO; d <= endISO; d = addDaysISO(d, 1)) {
            dates.push(d);
        }

        const results = [];

        let idx = 0;
        const worker = async () => {
            while (idx < dates.length) {
                const current = dates[idx++];
                try {
                    const response = await fetch(buildCurrencyRatesUrl(currencyCode, current));
                    const data = await response.json();

                    const date = data.date ?? current;
                    const [base, ratesObj] = Object.entries(data).find(([k]) => k !== "date") ?? [];
                    let ratesArr = Object.entries(ratesObj ?? {}).map(([code, value]) => ({
                        code,
                        value,
                    }));

                    ratesArr = filterFn ? filterFn(ratesArr, currencyCode) : ratesArr;
                    ratesArr = filterCertainCurrency(ratesArr, onlyCurrencies);

                    results.push({ date, base, ratesObj, ratesArr });
                } catch (err) {
                    if (!continueOnError) throw err;
                    results.push({ date: current, base: undefined, ratesObj: undefined, ratesArr: [], error: String(err) });
                }
            }
        };

        const poolSize = Math.max(1, Math.min(concurrency, dates.length));
        await Promise.all(Array.from({ length: poolSize }, worker));

        results.sort((a, b) => String(a.date).localeCompare(String(b.date)));
        return results;
    });
}
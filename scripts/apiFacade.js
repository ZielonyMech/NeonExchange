import { config } from './config/config.js';
import { withLoading, filterAvailableCurrencies, filterAvailableCurrenciesWithohutSelf       } from './misc.js';

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
        const response = await fetch(`${config.endpoints.currencyRates}/${currencyCode}.json`);
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
import { APIgetCurrencyRates } from '/scripts/apiFacade.js';
import { formatRateToNumber } from '/scripts/dataParser.js';

const currencyCompare = (elem, currency) => elem.code.toUpperCase() === currency.toUpperCase();

export async function getTodayCurrencyPrice(asset, baseCurrency) {
    if (!asset || !baseCurrency) return null;
    
    const baseCurrencyRates = await APIgetCurrencyRates(baseCurrency);
    const assetCurrencyRates = await APIgetCurrencyRates(asset.boughtCurrencyName);

    const assetCurrencyRate = baseCurrencyRates.ratesArr.find(elem => currencyCompare(elem, asset.boughtCurrencyName)).value;
    const baseCurrencyRate = assetCurrencyRates.ratesArr.find(elem => currencyCompare(elem, baseCurrency)).value;

    return {
        assetCurrencyRate: formatRateToNumber(assetCurrencyRate),
        baseCurrencyRate: formatRateToNumber(baseCurrencyRate),
    };
}

export async function getAssetTodayValue(asset, baseCurrency) {
    if (!asset || !baseCurrency) return null;

    const todayRates = await getTodayCurrencyPrice(asset, baseCurrency);

    return formatRateToNumber(asset.boughtAmount * todayRates.baseCurrencyRate);   
}
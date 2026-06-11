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

    return formatRateToNumber(asset.boughtAmount * Number(todayRates.baseCurrencyRate));   
}

export function calculateHistoryNetValue(loggedUser, minDate = null) {
    const filteredTransactions = getHistoryData(loggedUser, minDate);

    const totalHistoryDifference = filteredTransactions.reduce((acc, transaction) => {
        return acc + Number(transaction.netValue);
    }, 0);

    return totalHistoryDifference;
}

export function getHistoryDataByDate(loggedUser, minDate = null) {
    const historyData = getHistoryData(loggedUser, minDate);

    const historyByDate = historyData.reduce((acc, transaction) => {
        const dateKey = new Date(transaction.sellDate).toLocaleDateString();
        const existing = acc.find(item => item.date === dateKey);
        
        if (existing) {
            existing.total += Number(transaction.netValue);
        } else {
            acc.push({ date: dateKey, total: Number(transaction.netValue) });
        }
        
        return acc;
    }, []);

    return historyByDate.reduce((acc, item) => {
        const prevDateTotal = acc.length > 0 ? acc[acc.length - 1].value : 0;
        acc.push({ date: item.date, value: item.total + prevDateTotal });
        return acc;
    }, [])
}

export function getHistoryData(loggedUser, minDate = null) {
    if (!minDate) minDate = new Date(loggedUser.creationDate);

    return loggedUser.transactions.filter(transaction => 
        transaction.sellDate && new Date(transaction.sellDate) >= minDate
    );
}

export async function calculateTodayNetValue(loggedUser) {
    const currentTransactions = loggedUser.transactions.filter(
        transaction => !transaction.sellDate
    );

    const values = await Promise.all(
        currentTransactions.map(async (transaction) => {
            const todayValue = await getAssetTodayValue(transaction.asset, loggedUser.baseCurrency);
            return transaction.asset.purchasePrice - todayValue;
        })
    );

    const totalTodayNet = values.reduce((acc, value) => acc + Number(value), 0);
    return totalTodayNet;   
}
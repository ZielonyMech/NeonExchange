import { getLoggedUser, syncLoggedUser, logoutCurrentUser } from '/scripts/globalState.js';
import { APIgetCurrencyRates } from '/scripts/apiFacade.js';
import { getTodayCurrencyPrice, getAssetTodayValue, calculateHistoryDifference, calculateTodayDifference } from '/scripts/currency.js';
import { createTransaction } from '/scripts/utils/types.js';
import { formatRateToNumber, formatRateToString } from '/scripts/dataParser.js';

window.addEventListener('DOMContentLoaded', async () => {
    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        alert('Musisz być zalogowany, aby zobaczyć tę stronę!');
        document.location.href = '/pages/auth/login/login.html';
        return;
    }

    document.querySelector('#logout').addEventListener('click', logout);
    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            document.getElementById(tabId).classList.add('active');
        });
    });

    document.querySelector('#add-funds').addEventListener('click', async () => {
        loggedUser.balance = Number(loggedUser.balance) + 100;
        syncLoggedUser(loggedUser);
        await renderUserData(loggedUser);
    })

    document.querySelector('#startDate').addEventListener('change', async (e) => {
        const selectedDate = e.target.value;
        await renderUserData(loggedUser);
    });

    await renderUserData(loggedUser);
});

async function renderOwnedAssets(loggedUser) {
    const assetsContainer = document.querySelector('.assetsList');
    assetsContainer.innerHTML = '';

    const currentAssets = loggedUser.transactions.filter(elem => !elem.sellDate);
    
    if (currentAssets.length === 0) {
        assetsContainer.innerHTML = '<p>Brak aktywów do wyświetlenia.</p>';
        return
    }

    for (const asset of currentAssets) {
        const assetElement = await createTransactionElement(asset);
        assetsContainer.appendChild(assetElement);

        const todayValue = getAssetTodayValue(asset);
        const purchaseValue = formatRateToNumber(asset.boughtAmount);
    }  
}

async function renderTransactionHistory(loggedUser) {
    const historyContainer = document.querySelector('.historyList');

    historyContainer.innerHTML = '';

    const historyAssets = loggedUser.transactions.filter(elem => elem.sellDate);

    if (historyAssets.length === 0) {
        historyContainer.innerHTML = '<p>Brak transakcji do wyświetlenia.</p>';
        return;
    }

    for (const transaction of historyAssets) {
        const historyElement = await createHistoryElement(transaction);
        historyContainer.appendChild(historyElement);
    }  
}

async function renderUserData(loggedUser) {
    const usernameElement = document.querySelector('#username');
    const balanceElement = document.querySelector('#balance');
    const userCurrency = document.querySelector('#userCurrency');
    const totalBalanceElement = document.querySelector('#totalBalance');
    const dayStatusElement = document.querySelector('#dayStatus');
    const creationDateElement = document.querySelector('#creationDate');
    const datePicker = document.querySelector('#startDate');
    
    usernameElement.textContent = loggedUser.email;
    balanceElement.textContent = `${Number(loggedUser.balance).toFixed(2)} PLN`;
    userCurrency.textContent = loggedUser.baseCurrency;
    creationDateElement.textContent = new Date(loggedUser.creationDate).toLocaleDateString();

    await renderTransactionHistory(loggedUser);
    await renderOwnedAssets(loggedUser);
    
    datePicker.setAttribute('max', new Date().toISOString().split('T')[0]);
    datePicker.setAttribute('min', loggedUser.creationDate.split('T')[0]);

    if (!datePicker.value) datePicker.value = datePicker.getAttribute('min');
    
    const historyNetValue = calculateHistoryDifference(loggedUser, new Date(datePicker.value));
    const todayNetValue = await calculateTodayDifference(loggedUser);

    const totalDifference = historyNetValue + todayNetValue;

    totalBalanceElement.textContent = `${(Number(loggedUser.balance) + todayNetValue).toFixed(2)} PLN`;
    dayStatusElement.textContent = `${totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)} PLN`;
    dayStatusElement.classList.toggle('positive', totalDifference >= 0);
    dayStatusElement.classList.toggle('negative', totalDifference < 0);
}

function logout() {
    logoutCurrentUser();
    alert('Pomyślnie wylogowano');
    document.location.href = '/index.html';
}

async function sellAsset(transaction) {
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
        alert('Coś poszło nie tak...');
        return;
    }
    
    const todayAssetValue = Number(await getAssetTodayValue(transaction.asset, loggedUser.baseCurrency));
    loggedUser.balance = Number(loggedUser.balance) + Number(todayAssetValue.toFixed(2));

    const transactionIndex = loggedUser.transactions.findIndex(elem => elem.id === transaction.id);

    if (transactionIndex === -1) {
        alert('Coś poszło nie tak...');
        return;
    }

    const originalTransaction = loggedUser.transactions[transactionIndex];
    originalTransaction.sellDate = new Date();
    originalTransaction.netValue = formatRateToNumber(todayAssetValue - Number(transaction.asset.purchasePrice));

    alert('Udało się sprzedać aktywo!');

    syncLoggedUser(loggedUser);
    renderUserData(loggedUser);
}

async function createHistoryElement(transaction) {
    return createAssetCard(transaction, true);
}
 
async function createTransactionElement(transaction) {
    return createAssetCard(transaction, false);
}

async function createAssetCard(transaction, isSold = false) {
    const templateId = isSold ? '#historyCard' : '#assetCard';
    const template = document.querySelector(templateId);
    const assetElement = template.content.cloneNode(true);
    
    const asset = transaction.asset;
    const loggedUser = getLoggedUser();
    
    const nameElement = assetElement.querySelector('slot[name="name"]');
    const quantityElement = assetElement.querySelector('slot[name="quantity"]');
    const buyPriceElement = assetElement.querySelector('slot[name="buyPrice"]');
    const buyDateElement = assetElement.querySelector('slot[name="buyDate"]');
    const assetCardElement = assetElement.querySelector('.assetCard');
    
    nameElement.textContent = asset.boughtCurrencyName;
    buyDateElement.textContent = transaction.buyDate ? new Date(transaction.buyDate).toLocaleDateString() : 'N/A';
    
    if (isSold) {
        const saleValueElement = assetElement.querySelector('slot[name="saleValue"]');
        const saleDateElement = assetElement.querySelector('slot[name="saleDate"]');
        
        quantityElement.textContent = `${formatRateToString(asset.boughtAmount)} ${asset.boughtCurrencyName}`;
        buyPriceElement.textContent = `${formatRateToString(asset.purchasePrice)} ${asset.baseCurrency}`;
        saleValueElement.textContent = `${formatRateToString(Number(transaction.netValue) + asset.purchasePrice)} ${asset.baseCurrency}`;
        saleDateElement.textContent = transaction.sellDate ? new Date(transaction.sellDate).toLocaleDateString() : 'N/A';
        
        const profitLoss = formatRateToNumber(transaction.netValue - asset.purchasePrice);
        assetCardElement.classList.toggle('positive', profitLoss >= 0);
        assetCardElement.classList.toggle('negative', profitLoss < 0);
    } else {
        const currentValueElement = assetElement.querySelector('slot[name="currentValue"]');
        const assetCompareDifference = assetElement.querySelector('slot[name="assetCompareDifference"]');
        const sellButton = assetElement.querySelector('.sell-btn');
        
        const assetTodayValue = await getAssetTodayValue(asset, loggedUser.baseCurrency);
        
        quantityElement.textContent = `${formatRateToString(asset.boughtAmount)} ${asset.boughtCurrencyName}`;
        buyPriceElement.textContent = `${formatRateToString(asset.purchasePrice)} ${asset.baseCurrency}`;
        currentValueElement.textContent = `${formatRateToString(assetTodayValue)} ${asset.baseCurrency}`;
        
        const netValue = assetTodayValue - asset.purchasePrice;
        assetCompareDifference.textContent = `${netValue >= 0 ? '+' : ''}${formatRateToString(netValue)} ${asset.baseCurrency}`;
        assetCardElement.classList.toggle('positive', netValue >= 0);
        assetCardElement.classList.toggle('negative', netValue < 0);
        
        sellButton.addEventListener('click', () => sellAsset(transaction));
    }
    
    return assetElement;
}
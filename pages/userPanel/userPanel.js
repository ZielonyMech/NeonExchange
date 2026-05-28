import { getLoggedUser, syncLoggedUser, logoutCurrentUser } from '/scripts/globalState.js';
import { APIgetCurrencyRates } from '/scripts/apiFacade.js';

window.addEventListener('load', async () => {
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

    await renderUserData(loggedUser);
});

async function renderOwnedAssets(loggedUser) {
    const assetsContainer = document.querySelector('.assetsList');

    let totalAssetValue = 0;
    let totalTodayDifference = 0;
    assetsContainer.innerHTML = '';

    if (loggedUser.ownedAssets.length === 0) {
        document.querySelector('.assetsList').innerHTML = '<p>Brak aktywów do wyświetlenia.</p>';
        return {
            totalAssetValue,
            totalTodayDifference
        }
    }

    for (const asset of loggedUser.ownedAssets) {
        const assetElement = await createAssetElement(asset);
        assetsContainer.appendChild(assetElement);

        const todayValue = Number((await getTodayCurrencyPrice(asset)).accountCurrencyValue) || 0;
        const purchaseValue = Number(asset.quantity).toFixed(2);

        totalAssetValue += todayValue;
        totalTodayDifference += todayValue - purchaseValue;
    }  

    return {
        totalAssetValue,
        totalTodayDifference
    }
}

async function renderTransactionHistory(loggedUser) {
    const historyContainer = document.querySelector('.historyList');

    historyContainer.innerHTML = '';

    if (loggedUser.transactionHistory.length === 0) {
        historyContainer.innerHTML = '<p>Brak transakcji do wyświetlenia.</p>';
        return;
    }

    for (const asset of loggedUser.transactionHistory) {
        const historyElement = await createHistoryElement(asset);
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
    userCurrency.textContent = loggedUser.userCurrency;
    creationDateElement.textContent = new Date(loggedUser.creationDate).toLocaleDateString();

    await renderTransactionHistory(loggedUser);
    const { totalAssetValue, totalTodayDifference } = await renderOwnedAssets(loggedUser);
    
    datePicker.setAttribute('max', new Date().toISOString().split('T')[0]);
    datePicker.setAttribute('min', loggedUser.creationDate.split('T')[0]);
    datePicker.value = datePicker.getAttribute('min');

    const totalDifference = calculateTotalDifference(loggedUser, new Date(datePicker.value)) + totalTodayDifference;

    console.log(totalTodayDifference);
    
    totalBalanceElement.textContent = `${(Number(loggedUser.balance) + totalAssetValue).toFixed(2)} PLN`;
    dayStatusElement.textContent = `${totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)} PLN`;
    dayStatusElement.classList.toggle('positive', totalDifference >= 0);
    dayStatusElement.classList.toggle('negative', totalDifference < 0);
}

function calculateTotalDifference(loggedUser, minDate = null, maxDate = new Date().toISOString()) {
    if (!minDate) minDate = new Date(loggedUser.creationDate);

    const filteredTransactions = loggedUser.transactionHistory.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= minDate && transactionDate <= maxDate;
    });

    const totalHistoryDifference = filteredTransactions.reduce((acc, transaction) => {
        return acc + transaction.amount;
    }, 0);

    return totalHistoryDifference;
}

async function getTodayCurrencyPrice(asset) {
    const loggedUser = getLoggedUser();
    
    const boughtCurrencyRate = await APIgetCurrencyRates(loggedUser.userCurrency);
    const assetCurrencyRate = await APIgetCurrencyRates(asset.name);

    const todayCurrencyRate = boughtCurrencyRate.ratesArr.find(elem => elem.code.toUpperCase() === asset.name.toUpperCase()).value;
    const userCurrencyRate = assetCurrencyRate.ratesArr.find(elem => elem.code.toUpperCase() === loggedUser.userCurrency.toUpperCase()).value;
    
    const boughtCurrencyValue = (todayCurrencyRate * asset.quantity).toFixed(2);

    return {
        boughtCurrencyValue: Number(boughtCurrencyValue),
        accountCurrencyValue: (userCurrencyRate * Number(boughtCurrencyValue)).toFixed(2)
    };
}

function logout() {
    logoutCurrentUser();
    alert('Pomyślnie wylogowano');
    document.location.href = '/index.html';
}

async function sellAsset(asset) {
    const todayPrice = await getTodayCurrencyPrice(asset);
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
        alert('Coś poszło nie tak...');
        return;
    }

    loggedUser.balance += Number(todayPrice.accountCurrencyValue);

    const soldAssetIndex = loggedUser.ownedAssets.findIndex(elem => 
        elem.name === asset.name &&
        elem.quantity === asset.quantity &&
        elem.buyDate === asset.buyDate
    );

    if (soldAssetIndex !== -1) {
        loggedUser.ownedAssets.splice(soldAssetIndex, 1);
    }

    loggedUser.transactionHistory.push({
        type: 'sell',
        asset: asset,
        date: new Date().toISOString(),
        amount: Number(todayPrice.boughtCurrencyValue)
    });

    alert('Udało się sprzedać aktywo!');

    syncLoggedUser(loggedUser);
    renderUserData(loggedUser);
}

async function createHistoryElement(asset) {
    const template = document.querySelector('#historyCard');
    const historyElement = template.content.cloneNode(true);

    const nameElement = historyElement.querySelector('slot[name="name"]');
    const quantityElement = historyElement.querySelector('slot[name="quantity"]');
    const buyPriceElement = historyElement.querySelector('slot[name="buyPrice"]');
    const saleValueElement = historyElement.querySelector('slot[name="saleValue"]');
    const saleDateElement = historyElement.querySelector('slot[name="saleDate"]');
    const buyDateElement = historyElement.querySelector('slot[name="buyDate"]');
    const assetCardElement = historyElement.querySelector('.assetCard');

    nameElement.textContent = asset.asset.name;
    quantityElement.textContent = asset.asset.quantity;
    buyPriceElement.textContent = `${Number(asset.asset.value).toFixed(2)} ${asset.asset.name}`;
    saleValueElement.textContent = `${Number(asset.amount).toFixed(2)} ${asset.asset.name}`;
    buyDateElement.textContent = new Date(asset.asset.buyDate).toLocaleDateString();
    saleDateElement.textContent = new Date(asset.date).toLocaleDateString();

    const profitLoss = (Number(asset.amount) - Number(asset.asset.value)).toFixed(2);
    assetCardElement.classList.toggle('positive', Number(profitLoss) >= 0);
    assetCardElement.classList.toggle('negative', Number(profitLoss) < 0);

    return historyElement;
}
 
async function createAssetElement(asset) {
    const template = document.querySelector('#assetCard');
    const assetElement = template.content.cloneNode(true);

    const nameElement = assetElement.querySelector('slot[name="name"]');
    const quantityElement = assetElement.querySelector('slot[name="quantity"]');
    const buyPriceElement = assetElement.querySelector('slot[name="buyPrice"]');
    const currentValueElement = assetElement.querySelector('slot[name="currentValue"]');
    const assetCompareDifference = assetElement.querySelector('slot[name="assetCompareDifference"]');
    const buyDate = assetElement.querySelector('slot[name="buyDate"]');
    const assetCardElement = assetElement.querySelector('.assetCard');
    const sellButton = assetElement.querySelector('.sell-btn');

    // const todayAssetValue = (await getTodayCurrencyPrice(asset)).accountCurrencyValue;
    //temp
    const todayAssetValue = 0;
    const loggedUser = getLoggedUser();

    const assetCurrencyRate = await APIgetCurrencyRates(asset.name);
    const userCurrencyRate = assetCurrencyRate.ratesArr.find(elem => elem.code.toUpperCase() === loggedUser.userCurrency.toUpperCase()).value;

    nameElement.textContent = asset.name;
    quantityElement.textContent = asset.quantity;
    buyPriceElement.textContent = `${Number(asset.value).toFixed(2)} ${asset.name}`;
    currentValueElement.textContent = `${(Number(asset.value) * userCurrencyRate).toFixed(2)} ${loggedUser.userCurrency}`;
    buyDate.textContent = new Date(asset.buyDate).toLocaleDateString();

    const difference = ((Number(asset.value) * userCurrencyRate) - asset.quantity).toFixed(2);

    assetCompareDifference.textContent = `${difference >= 0 ? '+' : ''}${difference} ${loggedUser.userCurrency}`;
    assetCardElement.classList.toggle('positive', Number(difference) >= 0);
    assetCardElement.classList.toggle('negative', Number(difference) < 0);

    sellButton.addEventListener('click', () => sellAsset(asset));

    return assetElement;
}

document.querySelector('#startDate').addEventListener('change', (e) => {
    const selectedDate = e.target.value;
});
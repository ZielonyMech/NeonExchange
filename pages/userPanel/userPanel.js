import { getLoggedUser, syncLoggedUser, logoutCurrentUser } from '/scripts/globalState.js';
import { APIgetCurrencyRates } from '/scripts/apiFacade.js';
import { getTodayCurrencyPrice, getAssetTodayValue, calculateHistoryNetValue, calculateTodayNetValue, getHistoryDataByDate } from '/scripts/currency.js';
import { createTransaction } from '/scripts/utils/types.js';
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/auto/+esm";

const windowSize = 2; // tu bd jakiś rozmiar okna

let availableTabs = {
    'current-positions': { currentPage: 1, totalPages: 1 },
    'history': { currentPage: 1, totalPages: 1 }
};

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
        button.addEventListener('click', async () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            const currentTab = document.getElementById(tabId);
            currentTab.classList.add('active');

            await renderPaginationContent(tabId);
        });
    });

    document.querySelector('#add-funds').addEventListener('click', async () => {
        const loggedUser = getLoggedUser()

        loggedUser.balance = Number(loggedUser.balance) + 100;

        syncLoggedUser(loggedUser);
        await renderUserData(loggedUser);
    })

    document.querySelector('#startDate').addEventListener('change', async (e) => {
        const selectedDate = e.target.value;
        await renderUserData(getLoggedUser());
    });

    document.querySelector('#pagination-element-count').addEventListener('change', async (e) => {
        const activeTab = document.querySelector('.tab-content.active');
        updateUserTransactions(getLoggedUser(), true);
        await renderPaginationContent(activeTab.id);
    });

    await renderUserData(loggedUser);
});

const getPaginationSize = () => Number(document.querySelector('#pagination-element-count').value);

function updateUserTransactions(loggedUser, initial = false) {
    const paginationSize = getPaginationSize();

    const historyTransactions = loggedUser.transactions.filter(elem => elem.sellDate);
    const currentTransactions = loggedUser.transactions.filter(elem => !elem.sellDate);

    availableTabs['current-positions'].totalPages = Math.ceil(currentTransactions.length / paginationSize);
    availableTabs['history'].totalPages = Math.ceil(historyTransactions.length / paginationSize);

    if (initial) {
        availableTabs['current-positions'].currentPage = 1;
        availableTabs['history'].currentPage = 1;
    }

    return { historyTransactions, currentTransactions };
}

function paginateTransactions(transactions, currentPage) {
    const startIndex = (currentPage - 1) * getPaginationSize();
    const endIndex = startIndex + getPaginationSize();
    return transactions.slice(startIndex, endIndex);
}

async function renderOwnedAssets(loggedUser) {
    const assetsContainer = document.querySelector('.assetsList');
    assetsContainer.innerHTML = '';

    const currentTransactions = loggedUser.transactions.filter(elem => !elem.sellDate);
    
    if (currentTransactions.length === 0) {
        assetsContainer.innerHTML = '<p>Brak aktywów do wyświetlenia.</p>';
        return;
    }

    const tabConfig = availableTabs['current-positions'];
    const paginatedAssets = paginateTransactions(currentTransactions, tabConfig.currentPage);

    for (const asset of paginatedAssets) {
        const assetElement = await createAssetCard(asset, false);
        assetsContainer.appendChild(assetElement);
    }
}

async function renderTransactionHistory(loggedUser) {
    const historyContainer = document.querySelector('.historyList');
    historyContainer.innerHTML = '';

    const historyTransactions = loggedUser.transactions.filter(elem => elem.sellDate);

    if (historyTransactions.length === 0) {
        historyContainer.innerHTML = '<p>Brak transakcji do wyświetlenia.</p>';
        return;
    }

    const tabConfig = availableTabs['history'];
    const paginatedHistory = paginateTransactions(historyTransactions, tabConfig.currentPage);

    for (const transaction of paginatedHistory) {
        const historyElement = await createAssetCard(transaction, true);
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

    updateUserTransactions(loggedUser);
    
    const activeTab = document.querySelector('.tab-content.active');
    await renderPaginationContent(activeTab.id);
    
    datePicker.setAttribute('max', new Date().toISOString().split('T')[0]);
    datePicker.setAttribute('min', loggedUser.creationDate.split('T')[0]);

    if (!datePicker.value) datePicker.value = datePicker.getAttribute('min');
    
    const historyNetValue = calculateHistoryNetValue(loggedUser, new Date(datePicker.value));
    const todayNetValue = await calculateTodayNetValue(loggedUser);

    const totalDifference = historyNetValue + todayNetValue;
    renderHistoryChart(getHistoryDataByDate(loggedUser, new Date(datePicker.value)));

    totalBalanceElement.textContent = `${(Number(loggedUser.balance) + todayNetValue).toFixed(2)} PLN`;
    dayStatusElement.textContent = `${totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)} PLN`;
    dayStatusElement.classList.toggle('positive', totalDifference >= 0);
    dayStatusElement.classList.toggle('negative', totalDifference < 0);
}

let chart = null

function renderHistoryChart(historyNetValue) {
    const chartContainer = document.querySelector('#history-chart');
    
    if(chart) chart.destroy();

    chart = new Chart(chartContainer, {
        type: 'line',
        data: {
            labels: historyNetValue.map(elem => elem.date),
            datasets: [{
                label: 'Wartość netto z historii transakcji',
                data: historyNetValue.map(elem => elem.value),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });
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
    originalTransaction.netValue = (todayAssetValue - Number(transaction.asset.purchasePrice)).toFixed(2);

    alert('Udało się sprzedać aktywo!');

    syncLoggedUser(loggedUser);
    renderUserData(loggedUser);
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
        
        quantityElement.textContent = `${asset.boughtAmount.toFixed(2)} ${asset.boughtCurrencyName}`;
        buyPriceElement.textContent = `${asset.purchasePrice.toFixed(2)} ${asset.baseCurrency}`;
        saleValueElement.textContent = `${(Number(transaction.netValue) + asset.purchasePrice).toFixed(2)} ${asset.baseCurrency}`;
        saleDateElement.textContent = transaction.sellDate ? new Date(transaction.sellDate).toLocaleDateString() : 'N/A';
        
        const profitLoss = (transaction.netValue - asset.purchasePrice).toFixed(2);
        assetCardElement.classList.toggle('positive', profitLoss >= 0);
        assetCardElement.classList.toggle('negative', profitLoss < 0);
    } else {
        const currentValueElement = assetElement.querySelector('slot[name="currentValue"]');
        const assetCompareDifference = assetElement.querySelector('slot[name="assetCompareDifference"]');
        const sellButton = assetElement.querySelector('.sell-btn');
        
        const assetTodayValue = Number(await getAssetTodayValue(asset, loggedUser.baseCurrency));
        
        quantityElement.textContent = `${asset.boughtAmount.toFixed(2)} ${asset.boughtCurrencyName}`;
        buyPriceElement.textContent = `${asset.purchasePrice.toFixed(2)} ${asset.baseCurrency}`;
        currentValueElement.textContent = `${assetTodayValue.toFixed(2)} ${asset.baseCurrency}`;
        
        const netValue = assetTodayValue - asset.purchasePrice;
        assetCompareDifference.textContent = `${netValue >= 0 ? '+' : ''}${netValue.toFixed(2)} ${asset.baseCurrency}`;
        assetCardElement.classList.toggle('positive', netValue >= 0);
        assetCardElement.classList.toggle('negative', netValue < 0);
        
        sellButton.addEventListener('click', () => sellAsset(transaction));
    }
    
    return assetElement;
}

async function renderPaginationContent(tabId) {
    const loggedUser = getLoggedUser();

    updateUserTransactions(loggedUser);

    if (tabId === 'current-positions') {
        await renderOwnedAssets(loggedUser);
    } else {
        await renderTransactionHistory(loggedUser);
    }
    
    const paginationContainer = document.querySelector('#pagination');
    paginationContainer.innerHTML = '';

    const tabConfig = availableTabs[tabId];
    const { currentPage, totalPages } = tabConfig;

    if (totalPages <= 1) return; 

    const changePage = async (pageNum) => {
        tabConfig.currentPage = pageNum;
        await renderPaginationContent(tabId);
    };

    const addButton = (text, pageNum, isActive = false, isDisabled = false) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = isDisabled || isActive;
        
        if (isActive) button.classList.add('active');
        if (!isDisabled && !isActive) button.addEventListener('click', () => changePage(pageNum));
        
        return button;
    };

    if (currentPage > 1) paginationContainer.appendChild(addButton('«', currentPage - 1));

    const startPage = Math.max(1, currentPage - windowSize);
    const endPage = Math.min(totalPages, currentPage + windowSize);

    if (startPage > 1) {
        paginationContainer.appendChild(addButton('1', 1, currentPage === 1));
        if (startPage > 2) {
            const span = document.createElement('span');
            span.textContent = '...';
            paginationContainer.appendChild(span);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationContainer.appendChild(addButton(i, i, currentPage === i));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const span = document.createElement('span');
            span.textContent = '...';
            paginationContainer.appendChild(span);
        }
        paginationContainer.appendChild(addButton(totalPages, totalPages, currentPage === totalPages));
    }

    if (currentPage < totalPages) paginationContainer.appendChild(addButton('»', currentPage + 1));

    if (currentPage > totalPages) changePage(currentPage - 1);
}

function renderPagintaionButtons() {

}
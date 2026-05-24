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

    await renderOwnedAssets(loggedUser);
});

async function renderOwnedAssets(loggedUser) {
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

    const assetsContainer = document.querySelector('.assetsList');

    let totalAssetValue = 0;
    let totalDifference = 0;

    if (loggedUser.ownedAssets.length > 0) {
        assetsContainer.innerHTML = '';
        for (const asset of loggedUser.ownedAssets) {
            const assetElement = await createAssetElement(asset);
            assetsContainer.appendChild(assetElement);

            const todayValue = Number((await getTodayCurrencyPrice(asset)).accountCurrencyValue) || 0;
            const purchaseValue = Number(asset.value) || 0;

            totalAssetValue += todayValue;
            totalDifference += todayValue - purchaseValue;
        }
    }

    totalBalanceElement.textContent = `${(Number(loggedUser.balance) + totalAssetValue).toFixed(2)} PLN`;
    dayStatusElement.textContent = `${totalDifference >= 0 ? '+' : ''}${totalDifference.toFixed(2)} PLN`;
    dayStatusElement.classList.toggle('positive', totalDifference >= 0);
    dayStatusElement.classList.toggle('negative', totalDifference < 0);

    datePicker.setAttribute('max', new Date().toISOString().split('T')[0]);
    datePicker.setAttribute('min', loggedUser.creationDate.split('T')[0]);
    datePicker.value = datePicker.getAttribute('min');

    // drawAccountChart(loggedUser);
}

async function getTodayCurrencyPrice(asset) {
    const loggedUser = getLoggedUser();
    
    const boughtCurrencyRate = await APIgetCurrencyRates(loggedUser.userCurrency);
    const assetCurrencyRate = await APIgetCurrencyRates(asset.name);

    const todayCurrencyRate = boughtCurrencyRate.ratesArr.find(elem => elem.code.toUpperCase() === asset.name.toUpperCase()).value;
    const userCurrencyRate = assetCurrencyRate.ratesArr.find(elem => elem.code.toUpperCase() === loggedUser.userCurrency.toUpperCase()).value;
    
    const boughtCurrencyValue = (todayCurrencyRate * asset.quantity).toFixed(2);

    return {
        boughtCurrencyValue: boughtCurrencyValue,
        accountCurrencyValue: (userCurrencyRate * boughtCurrencyValue).toFixed(2)
    };
}

function logout() {
    logoutCurrentUser();
    alert('Pomyślnie wylogowano');
    document.location.href = '/index.html';
}

async function sellAsset(asset) {
    const todayPrice = Number(await getTodayCurrencyPrice(asset));
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
        alert('Coś poszło nie tak...');
        return;
    }

    loggedUser.balance += todayPrice;

    const soldAssetIndex = loggedUser.ownedAssets.findIndex(elem => 
        elem.name === asset.name &&
        elem.quantity === asset.quantity &&
        elem.buyDate === asset.buyDate
    );

    if (soldAssetIndex !== -1) {
        loggedUser.ownedAssets.splice(soldAssetIndex, 1);
    }

    alert('Udało się sprzedać aktywo!');

    syncLoggedUser(loggedUser);
    await renderOwnedAssets(loggedUser);
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

    const todayAssetValue = (await getTodayCurrencyPrice(asset)).boughtCurrencyValue;

    nameElement.textContent = asset.name;
    quantityElement.textContent = asset.quantity;
    buyPriceElement.textContent = `${Number(asset.value).toFixed(2)} ${asset.name}`;
    currentValueElement.textContent = `${todayAssetValue} ${asset.name}`;
    buyDate.textContent = new Date(asset.buyDate).toLocaleDateString();

    const todayPrice = Number(todayAssetValue) || 0;
    const buyPriceValue = Number(asset.value) || 0;
    const difference = (todayPrice - buyPriceValue).toFixed(2);

    assetCompareDifference.textContent = `${difference >= 0 ? '+' : ''}${difference} PLN`;
    assetCardElement.classList.toggle('positive', Number(difference) >= 0);
    assetCardElement.classList.toggle('negative', Number(difference) < 0);

    sellButton.addEventListener('click', () => sellAsset(asset));

    return assetElement;
}

document.querySelector('#startDate').addEventListener('change', (e) => {
    const selectedDate = e.target.value;
});
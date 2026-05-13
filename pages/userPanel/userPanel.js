import { getLoggedUser, syncLoggedUser, logoutCurrentUser } from '/scripts/globalState.js';
import { APIgetCurrencyRates } from '/scripts/apiFacade.js';

window.addEventListener('load', async () => {
    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        alert("Musisz być zalogowany, aby zobaczyć tę stronę!");
        document.location.href = '/pages/auth/login/login.html';
        return;
    }

    document.querySelector('#logout').addEventListener('click', logout);

    renderOwnedAssets(loggedUser);
});

async function renderOwnedAssets(loggedUser) {
    const usernameElement = document.querySelector('#username');
    const balanceElement = document.querySelector('#balance');
    const userCurrency = document.querySelector('#userCurrency');

    usernameElement.textContent = loggedUser.email;
    balanceElement.textContent = `Saldo: ${loggedUser.balance} PLN`;
    userCurrency.textContent = `Waluta użytkownika: ${loggedUser.userCurrency}`;

    if (loggedUser.ownedAssets.length > 0) {
        const assetsContainer = document.querySelector('.assetsList');
        assetsContainer.innerHTML = '';

        for (const asset of loggedUser.ownedAssets) {
            const assetElement = await createAssetElement(asset);
            assetsContainer.appendChild(assetElement);
        }
    }
}

async function getTodayCurrenctPrice(asset) {
    const rates = await APIgetCurrencyRates(asset.name);
    const todayCurrencyRate = rates.ratesArr.find(elem => elem.code.toUpperCase() == "pln".toUpperCase()).value;

    return (todayCurrencyRate * asset.quantity).toFixed(2);
}

function logout() {
    logoutCurrentUser();
    alert("Pomyślnie wylogowano");
    document.location.href = '/index.html';
}

async function getAssetCompareString(asset) {
    const todayPrice = await getTodayCurrenctPrice(asset);
    const buyPrice = asset.value;

    console.log(todayPrice, buyPrice)

    let percent = todayPrice >= buyPrice ? '' : '-';
    percent += ((todayPrice / buyPrice) * 100).toFixed(3) + '%';
    let difference = (todayPrice - buyPrice).toFixed(2);

    return {
        difference,
        percent
    };
}

async function sellAsset(asset) {
    const todayPrice = await getTodayCurrenctPrice(asset);
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
        alert("Coś poszło nie tak...");
        return;
    }
    
    const sellPrice = asset.quantity * todayPrice;
    loggedUser.balance += sellPrice;

    const soldAssetIndex = loggedUser.ownedAssets.findIndex(elem => 
        elem.name == asset.name &&
        elem.quantity == asset.quantity &&
        elem.buyPrice == asset.buyPrice
    );

    if (soldAssetIndex !== -1) {
        loggedUser.ownedAssets.splice(soldAssetIndex, 1);
    }

    alert("Udało się sprzedać aktywo!");

    syncLoggedUser(loggedUser);
    renderOwnedAssets(loggedUser);
}
 
async function createAssetElement(asset) {
    const template = document.querySelector('#assetCard');
    const assetElement = template.content.cloneNode(true);

    const nameElement = assetElement.querySelector('slot[name="name"]');
    const quantityElement = assetElement.querySelector('slot[name="quantity"]');
    const buyPriceElement = assetElement.querySelector('slot[name="buyPrice"]');
    const assetComparePercent = assetElement.querySelector('slot[name="assetComparePercent"]')
    const assetCompareDifference = assetElement.querySelector('slot[name="assetCompareDifference"]')
    const compareSlot = assetElement.querySelector('.compareSlot');
    const sellButton = assetElement.querySelector('.sellButton');

    nameElement.textContent = asset.name;
    quantityElement.textContent = asset.quantity;
    buyPriceElement.textContent = asset.value;

    const compareObj = await getAssetCompareString(asset);
    assetComparePercent.textContent = compareObj.percent;
    assetCompareDifference.textContent = compareObj.difference;

    compareSlot.style.color = compareObj.percent[0] === '-' ? 'red' : 'green'

    sellButton.addEventListener('click', () => sellAsset(asset))


    return assetElement;
}
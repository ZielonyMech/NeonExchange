import { getLoggedUser } from '/scripts/globalState.js';

window.addEventListener('load', () => {
    const loggedUser = getLoggedUser();

    if (!loggedUser) {
        alert("Musisz być zalogowany, aby zobaczyć tę stronę!");
        document.location.href = '/pages/auth/login/login.html';
    }

    const usernameElement = document.querySelector('#username');
    const balanceElement = document.querySelector('#balance');

    usernameElement.textContent = loggedUser.username;
    balanceElement.textContent = `Saldo: ${loggedUser.balance} PLN`;

    if (loggedUser.ownedAssets.length > 0) {
        const assetsContainer = document.querySelector('.assetsList');

        loggedUser.ownedAssets.forEach(asset => {
            const assetElement = createAssetElement(asset);
            assetsContainer.appendChild(assetElement);
        });
    }
});

function createAssetElement(asset) {
    const template = document.querySelector('#assetCard');
    const assetElement = template.content.cloneNode(true);

    const nameElement = assetElement.querySelector('slot[name="name"]');
    const quantityElement = assetElement.querySelector('slot[name="quantity"]');
    const buyPriceElement = assetElement.querySelector('slot[name="buyPrice"]');

    nameElement.textContent = asset.name;
    quantityElement.textContent = asset.quantity;
    buyPriceElement.textContent = asset.value;

    return assetElement;
}
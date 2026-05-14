import { APIgetAvailableCurrencies, APIgetCurrencyRates } from '/scripts/apiFacade.js';
import { addDaysISO, toISODate } from '/scripts/ISODataParser.js';
import { toggleActive } from '/scripts/misc.js';
import { formatRate } from '/scripts/dataParser.js';
import { getLoggedUser, syncLoggedUser } from '/scripts/globalState.js';
import { renderChart } from '/pages/exchange/currencyChart.js'

let currentBaseCurrency = null;
let currentSelectedCurrency = null;
let currencyRate = null;

function setCurrencyRate(rate) {
    currencyRate = rate;
    document.querySelector('.infoSubLabel').textContent = rate.toFixed(2);
}

function renderRates({ date, base, ratesArr }, selectedCurrencyCode) {
    const container = document.querySelector('.exchangeRates');
    if (!container) return;

    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'ratesHeader';
    header.textContent = `Kursy dla ${selectedCurrencyCode?.toUpperCase()} (${date})`;

    const grid = document.createElement('div');
    grid.className = 'ratesGrid';

    const frag = document.createDocumentFragment();

    [...ratesArr].forEach((rateObj) => {
        frag.appendChild(createRateCard(grid, rateObj, selectedCurrencyCode));
    });

    grid.appendChild(frag);
    container.append(header, grid);
}

async function getCurrencyRates(currency) {
    try {
        const exchangeValues = await APIgetCurrencyRates(currency);
        renderRates(exchangeValues, currency);
    }
    catch (err) {
        //tu miejsce na takiego popupa i wyswietlenie ponowienia requesta
        console.log(err);
        console.log("wiwi");
    }
}

async function searchCurrency(value) {
    const currencies = await APIgetAvailableCurrencies();
    
    const currenciesContainer = document.querySelector('.availableCurrencies');
    currenciesContainer.innerHTML = "";

    const filteredCurrencies = currencies.filter(currency => currency.name.toLowerCase().trim().includes(value.toLowerCase().trim()));

    filteredCurrencies.forEach(currency => {
        currenciesContainer.appendChild(createCurrencyCard(currenciesContainer, currency));
    });
}

function createCurrencyCard(root, currency) {
    const template = document.querySelector('#currencyCard');
    const currencyElement = template.content.cloneNode(true);
    const parent = currencyElement.querySelector('.currencyCard');

    currencyElement.querySelector('slot[name="name"]').textContent = currency.name;
    currencyElement.querySelector('slot[name="code"]').textContent = currency.code.toUpperCase();

    parent.addEventListener('click', (elem) => {     
        toggleActive(root, parent, "selected");
        getCurrencyRates(currency.code);
    });

    return currencyElement;
}

function createRateCard(root, rate, selectedCurrencyCode) {
    const template = document.querySelector('#currencyRateCard');
    const rateCard = template.content.cloneNode(true);

    const parent = rateCard.querySelector('.currencyCard');
    const cardHeader = rateCard.querySelector('slot[name="name"]');
    const cardContent = rateCard.querySelector('slot[name="rate"]');

    parent.className = 'rateCard';
    parent.onclick = () => displayChartPopup(selectedCurrencyCode, rate.code);

    cardHeader.className = 'rateCode';
    cardHeader.textContent = rate.code.toUpperCase();

    cardContent.className = 'rateValue';
    cardContent.textContent = formatRate(rate.value);

    return rateCard;
}

function clearDialogInputs() {
    document.querySelector('.chartCurrencyAmount').textContent = "";
    document.querySelector('.infoSubLabel').textContent = "";
    document.querySelector('.chartCurrencyValue').textContent = "";
}

async function displayChartPopup(baseCurrency, selectedCurrency) {
    const dialog = document.querySelector('#chartDialog');
    dialog.showModal();

    currentBaseCurrency = baseCurrency;
    currentSelectedCurrency = selectedCurrency;

    document.querySelector('.chartCurrencyCode').textContent = `(${baseCurrency.toUpperCase()})`;

    const startDateInput = document.querySelector('.startDate');
    const endDateInput = document.querySelector('.endDate');

    if (!startDateInput.value) {
        startDateInput.value = toISODate(addDaysISO(Date.now(), -7));
    }
    if (!endDateInput.value) {
        endDateInput.value = toISODate(Date.now());
    }

    const range = {
        startDate: startDateInput.value,
        endDate: endDateInput.value
    };

    const loggedUser = getLoggedUser();
    if (loggedUser && baseCurrency.toUpperCase() === loggedUser.userCurrency.toUpperCase()) {
        document.querySelector('.btnKup').disabled = false;
    }
    else {
        document.querySelector('.btnKup').disabled = true;
    }

    renderChart(baseCurrency, selectedCurrency, range, { onRateSelected: setCurrencyRate });
}



document.querySelector('.startDate').addEventListener('change', (e) => {
    if (currentBaseCurrency && currentSelectedCurrency) {
        const startDate = e.target.value;
        const endDate = document.querySelector('.endDate').value;
        renderChart(currentBaseCurrency, currentSelectedCurrency, { startDate, endDate }, { onRateSelected: setCurrencyRate });
    }
});

document.querySelector('.endDate').addEventListener('change', (e) => {
    if (currentBaseCurrency && currentSelectedCurrency) {
        const startDate = document.querySelector('.startDate').value;
        const endDate = e.target.value;
        renderChart(currentBaseCurrency, currentSelectedCurrency, { startDate, endDate }, { onRateSelected: setCurrencyRate });
    }
});

document.querySelector('.btnPrzelicz').addEventListener('click', (e) => {
    const amount = Number(document.querySelector('.chartCurrencyAmount').value);
    const displaySpan = document.querySelector('.chartCurrencyValue');
    
    if (currencyRate !== null && !isNaN(amount)) {
        displaySpan.innerHTML = (amount * currencyRate).toFixed(2) + ` ${currentSelectedCurrency.toUpperCase()}`;
    }
});

const currencyInput = document.querySelector('#currency');

if (currencyInput) {
    currencyInput.addEventListener('input', (e) => {
        searchCurrency(e.target.value);
    });
}

function buyAsset(event) {
    console.log(event);
    const amountInput = document.querySelector('.chartCurrencyAmount');
    const amount = Number(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
        alert("Podaj poprawną ilość do kupienia!");
        return;
    }

    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        alert("Musisz być zalogowany, aby kupić tę walutę!");
        return;
    }

    const totalCost = Number((amount * currencyRate).toFixed(2));

    if (amount > loggedUser.balance) {
        alert("Brak wystarczających środków do zakupu waluty!");
        return;
    }

    const boughtAsset = {
        name: currentSelectedCurrency.toUpperCase(),
        quantity: amount,
        value: totalCost,
        buyDate: new Date().toISOString()
    }

    loggedUser.ownedAssets.push(boughtAsset);
    loggedUser.balance -= amount;
    syncLoggedUser(loggedUser);
    alert(`Kupiłeś ${totalCost} ${currentSelectedCurrency}!`);
}

document.querySelector('.btnKup').addEventListener('click', buyAsset);   

searchCurrency("");

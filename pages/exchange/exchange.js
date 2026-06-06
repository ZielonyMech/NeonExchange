import { APIgetAvailableCurrencies, APIgetCurrencyRates } from '/scripts/apiFacade.js';
import { addDaysISO, toISODate } from '/scripts/ISODateParser.js';
import { toggleActive } from '/scripts/misc.js';
import { formatRateToString } from '/scripts/dataParser.js';
import { getLoggedUser, syncLoggedUser } from '/scripts/globalState.js';
import { renderChart } from '/pages/exchange/currencyChart.js'
import { createAsset, createTransaction } from '/scripts/utils/types.js';

let currentBaseCurrency = null;
let currentSelectedCurrency = null;

let currencyRate = null;
let currencyDate = null;

function setCurrencyRate({value, date}) {
    currencyRate = value ?? 0;
    currencyDate = date ?? "";

    document.querySelector('.infoSubLabel').textContent = formatRateToString(currencyRate);
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
    cardContent.textContent = formatRateToString(rate.value);

    return rateCard;
}

function clearDialogInputs() {
    document.querySelector('.chartCurrencyValue').textContent = "";
    document.querySelector('.infoSubLabel').textContent = "";
    document.querySelector('.chartCurrencyAmount').value = "";
}

async function displayChartPopup(baseCurrency, selectedCurrency) {
    clearDialogInputs();

    const dialog = document.querySelector('#chartDialog');
    dialog.showModal();

    currentBaseCurrency = baseCurrency;
    currentSelectedCurrency = selectedCurrency;

    document.querySelector('.chartCurrencyCode').textContent = `(${baseCurrency.toUpperCase()})`;
    document.querySelector('#startDate').value = toISODate(addDaysISO(Date.now(), -7));
    document.querySelector('#endDate').value = toISODate(Date.now());

    const range = {
        startDate: document.querySelector('#startDate').value,
        endDate: document.querySelector('#endDate').value
    };

    document.querySelector('.btnKup').disabled = true;

    const loggedUser = getLoggedUser();
    if (loggedUser && baseCurrency.toUpperCase() === loggedUser.baseCurrency.toUpperCase()) {
        document.querySelector('.btnKup').disabled = false;
    }

    renderChart(baseCurrency, selectedCurrency, range, { onRateSelected: setCurrencyRate });
}

function buyAsset(event) {
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

    if (amount > loggedUser.balance) {
        alert("Brak wystarczających środków do zakupu waluty!");
        return;
    }

    const boughtAsset = createAsset(
        loggedUser.baseCurrency,
        amount,
        currentSelectedCurrency.toUpperCase(),
        currencyRate
    );

    const transaction = createTransaction(boughtAsset);

    loggedUser.transactions.push(transaction);
    loggedUser.balance -= boughtAsset.purchasePrice;

    syncLoggedUser(loggedUser);
    alert(`Kupiłeś ${boughtAsset.boughtAmount.toFixed(2)} ${currentSelectedCurrency}!`);
}

window.addEventListener('DOMContentLoaded', () => {
    for (let elem of document.querySelectorAll('#startDate', '#endDate')) {
        elem.addEventListener('change', (e) => {
            if (currentBaseCurrency && currentSelectedCurrency) {
                const startDate = document.querySelector('#startDate').value;
                const endDate = document.querySelector('#endDate').value;
                renderChart(currentBaseCurrency, currentSelectedCurrency, { startDate, endDate }, { onRateSelected: setCurrencyRate });
            }
        });
    }

    document.querySelector('.btnPrzelicz').addEventListener('click', (e) => {
        const amount = Number(document.querySelector('.chartCurrencyAmount').value);
        const displaySpan = document.querySelector('.chartCurrencyValue');
        
        if (currencyRate !== null && !isNaN(amount)) {
            displaySpan.innerHTML = (amount * currencyRate).toFixed(2) + ` ${currentSelectedCurrency.toUpperCase()}`;
        }
    });
    
    document.querySelector('#currency').addEventListener('input', (e) => {
        searchCurrency(e.target.value);
    });

    document.querySelector('.btnKup').addEventListener('click', buyAsset);   
    searchCurrency("");
});

import { APIgetAvailableCurrencies, APIgetCurrencyRates, APIgetCurrencyRatesRange } from '../scripts/apiFacade.js';
import { addDaysISO, toISODate } from '../scripts/dataParser.js';
import { toggleActive, withLoading } from '../scripts/misc.js';
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/auto/+esm";

function formatRate(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return String(value);
    if (num === 0) return '0';

    const abs = Math.abs(num);
    if (abs < 0.0001) return num.toExponential(4);
    if (abs < 1) return num.toFixed(6);
    if (abs < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
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

    [...ratesArr]
        .sort((a, b) => a.code.localeCompare(b.code))
        .forEach(({ code, value }) => {
            const card = document.createElement('div');
            card.className = 'rateCard';
            card.dataset.code = code;
            card.onclick = () => displayChartPopup(selectedCurrencyCode, code);

            const codeEl = document.createElement('div');
            codeEl.className = 'rateCode';
            codeEl.textContent = code.toUpperCase();

            const valueEl = document.createElement('div');
            valueEl.className = 'rateValue';
            valueEl.textContent = formatRate(value);

            card.append(codeEl, valueEl);
            frag.appendChild(card);
        });

    grid.appendChild(frag);
    container.append(header, grid);
}

async function getCurrencyRates(currency) {
    const exchangeValues = await APIgetCurrencyRates(currency);
    renderRates(exchangeValues, currency);
}

async function searchCurrency(value) {
    const currencies = await APIgetAvailableCurrencies();
    
    const currenciesContainer = document.querySelector('.availableCurrencies');
    currenciesContainer.innerHTML = "";

    const filteredCurrencies = currencies.filter(currency => currency.name.toLowerCase().trim().includes(value.toLowerCase().trim()));

    filteredCurrencies.forEach(currency => {
        currenciesContainer.appendChild(createCurrencyElement(currenciesContainer, currency));
    });
}

function createCurrencyElement(root, currency) {
    const currencyElement = document.createElement('div');
    currencyElement.className = 'currencyCard';
    currencyElement.innerHTML = `${currency.name}<br>(${currency.code.toUpperCase()}) `;

    currencyElement.addEventListener('click', (elem) => {       
        toggleActive(root, elem.target, "selected");
        getCurrencyRates(currency.code);
    });

    return currencyElement;
}

var chart = null;
const ctx = document.querySelector('.currencyChart');

let currentBaseCurrency = null;
let currentSelectedCurrency = null;
let currencyRate = null;

async function displayChartPopup(baseCurrency, selectedCurrency) {
    const dialog = document.querySelector('#chartDialog');
    dialog.showModal();

    const title = dialog.querySelector('.chartTitle');
    title.textContent = `Kurs 1 ${baseCurrency.toUpperCase()} -> ${selectedCurrency.toUpperCase()}`;

    currentBaseCurrency = baseCurrency;
    currentSelectedCurrency = selectedCurrency;

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

    renderChart(baseCurrency, selectedCurrency, range);
}

async function renderChart(baseCurrency, selectedCurrency, range) {
    if(chart) chart.destroy();

    let data = await withLoading(async () => APIgetCurrencyRatesRange(baseCurrency, range), ".loader");

    console.log(data);

    const labels = data.map(elem => elem.date);
    const chartData = {
        labels: labels,
        datasets: [{
            label: `Cena jednostkowa waluty ${selectedCurrency.toUpperCase()}`,
            data: data.map(elem => {
                const rate = elem.ratesArr.find(r => r.code === selectedCurrency);
                return rate ? rate.value : null;
            }),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const dataIndex = elements[0].index;
                    const datasetIndex = elements[0].datasetIndex;
                    const value = chart.data.datasets[datasetIndex].data[dataIndex];
                    
                    currencyRate = value;
                }
        },
        }
    });
}

document.querySelector('.startDate').addEventListener('change', (e) => {
    if (currentBaseCurrency && currentSelectedCurrency) {
        const startDate = e.target.value;
        const endDate = document.querySelector('.endDate').value;
        renderChart(currentBaseCurrency, currentSelectedCurrency, { startDate, endDate });
    }
});

document.querySelector('.endDate').addEventListener('change', (e) => {
    if (currentBaseCurrency && currentSelectedCurrency) {
        const startDate = document.querySelector('.startDate').value;
        const endDate = e.target.value;
        renderChart(currentBaseCurrency, currentSelectedCurrency, { startDate, endDate });
    }
});

document.querySelector('.chartCurrencyAmount').addEventListener('input', (e) => {
    const amount = Number(e.target.value);
    const displaySpan = document.querySelector('.chartCurrencyValue');
    
    if (chart && !isNaN(amount)) {
        displaySpan.innerHTML = (amount * currencyRate).toFixed(2) + ` ${currentSelectedCurrency.toUpperCase()}`;
    }
});

const currencyInput = document.querySelector('#currency');

if (currencyInput) {
    currencyInput.addEventListener('input', (e) => {
        searchCurrency(e.target.value);
    });
}

searchCurrency("");
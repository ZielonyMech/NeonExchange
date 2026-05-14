import { withLoading } from '/scripts/misc.js';
import { APIgetCurrencyRatesRange } from '/scripts/apiFacade.js';
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/auto/+esm";

const ctx = document.querySelector('.currencyChart');
var chart = null;
let selectedPoint = null;

export async function renderChart(baseCurrency, selectedCurrency, range, { onRateSelected } = {}) {
    if(chart) chart.destroy();

    let data = await withLoading(async () => APIgetCurrencyRatesRange(baseCurrency, range), ".loaderContainer");

    const labels = data.map(elem => elem.date);
    const chartData = {
        labels: labels,
        datasets: [{
            label: `Cena jednostkowa waluty ${selectedCurrency.toUpperCase()}`,
            data: data.map(elem => {
                const rate = elem.ratesArr.find(r => r.code === selectedCurrency);
                return rate ? rate.value : null;
            }),
            pointBackgroundColor: (ctx) => ctx.dataIndex === selectedPoint ? 'red' : 'blue',
            pointRadius: (ctx) => ctx.dataIndex === selectedPoint ? 8 : 4,
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
                    
                    selectedPoint = dataIndex;
                    onRateSelected?.(value);
                    
                    chart.update();
                }
        },
        }
    });

    selectedPoint = data.length - 1;
    const lastRate = data[selectedPoint].ratesArr.find(r => r.code === selectedCurrency);
    onRateSelected?.(lastRate ? lastRate.value : null);
}

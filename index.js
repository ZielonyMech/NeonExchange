import { APIgetCurrencyRates } from '/scripts/apiFacade.js';

async function updateHomeRates() {
    try {
        const { ratesArr } = await APIgetCurrencyRates('pln');

        const rateMap = {};
        ratesArr.forEach(r => { rateMap[r.code.toLowerCase()] = r.value; });

        document.querySelectorAll('.course-item[data-currency]').forEach(item => {
            const code = item.dataset.currency;
            const plnRate = rateMap[code];
            if (plnRate && plnRate > 0) {
                const inverted = 1 / plnRate;
                item.querySelector('strong').textContent = inverted.toFixed(4);
            }
        });
    } catch (err) {
        console.error('Nie udało się pobrać kursów na stronę główną:', err);
    }
}

window.addEventListener('DOMContentLoaded', updateHomeRates);

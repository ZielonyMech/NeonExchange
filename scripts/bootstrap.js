import { config } from "./config/config.js"
import { APIgetCurrencyRates, APIgetCurrencyRatesRange } from './apiFacade.js'

async function bootstrap() {
    console.log('Current config');
    console.log(config)

    console.log(await APIgetCurrencyRatesRange('EUR', {startDate: '2025-03-17', endDate: '2025-03-25' }));

    console.log('Bootstrapping done!');
}

document.addEventListener('DOMContentLoaded', bootstrap);
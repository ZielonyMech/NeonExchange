import { config } from "./config/config.js"
import { APIgetCurrencyRates, APIgetCurrencyRatesRange } from './apiFacade.js'

async function bootstrap() {
    console.log('Current config');
    console.log(config);
    
    console.log('Bootstrapping done!');
}

document.addEventListener('DOMContentLoaded', bootstrap);
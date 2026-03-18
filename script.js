import { config } from "./scripts/config/config.js"

function bootstrap() {
    console.log('bootstrapping done!');
    console.log(config.supportedCurrencies);

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const checkRatesBtn = document.getElementById('checkRatesBtn');
    const ratesSection = document.getElementById('rates');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen.toString());
        });
    }

    if (checkRatesBtn && ratesSection) {
        checkRatesBtn.addEventListener('click', () => {
            ratesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
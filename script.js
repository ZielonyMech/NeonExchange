import { config } from "./scripts/config/config.js"

function bootstrap() {
    console.log('bootstrapping done!');
    console.log(config.supportedCurrencies);

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen.toString());
        });
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
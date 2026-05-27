import { registerUser } from "/scripts/utils/auth.js"
import { config } from "/scripts/config/config.js"
const crypto = window.crypto

async function register(event) {
    event.preventDefault();

    const email = document.querySelector('#email');
    const password = document.querySelector('#password');
    const currency = document.querySelector('#currencySelect');
    const confirmPassword = document.querySelector('#confirmPassword');

    if (password.value !== confirmPassword.value) {
        NXPopup.toast({ type: 'warning', title: 'Uwaga', message: 'Hasła nie są identyczne!' });
        return;
    }
    
    if(!(await registerUser(email.value, password.value, currency.value))) {
        NXPopup.toast({ type: 'error', title: 'Błąd', message: 'Coś poszło nie tak...' });
        return;
    }
    
    NXPopup.toast({ type: 'success', title: 'Sukces', message: 'Rejestracja zakończona sukcesem! Możesz teraz się zalogować.' });
    document.location.href = '/pages/auth/login/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.register-form');
    if (form) {
        form.addEventListener('submit', register);
    }

    const currencySelect = document.querySelector('#currencySelect');

    for (const currency of config.supportedCurrencies) {
        const normalizedCurrency = currency.toUpperCase();
        
        const isDefault = normalizedCurrency === 'PLN';
        const option = new Option(normalizedCurrency, normalizedCurrency, isDefault, isDefault);

        currencySelect.add(option);
    }
});

function createOption(currencyCode) {

}
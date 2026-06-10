import { registerUser, checkEmailValidity, checkPasswordStrength } from "/scripts/utils/auth.js"
import { config } from "/scripts/config/config.js"
import { showToast } from "/styles/popups/popup.js"
const crypto = window.crypto

async function register(event) {
    event.preventDefault();

    const email = document.querySelector('#email');
    const password = document.querySelector('#password');
    const currency = document.querySelector('#currencySelect');
    const confirmPassword = document.querySelector('#confirmPassword');

    if (!email.value || !password.value || !confirmPassword.value) {
        showToast('Proszę wypełnić wszystkie pola!', 'error');
        return;
    }

    if (!checkEmailValidity(email.value)) {
        showToast('Nieprawidłowy format email!', 'error');
        return;
    }

    if(!checkPasswordStrength(password.value)) {
        showToast('Hasło musi mieć co najmniej 8 znaków, zawierać małą literę, dużą literę, cyfrę i znak specjalny!', 'error');
        return;
    }

    if (password.value !== confirmPassword.value) {
        showToast('Hasła nie są identyczne!', 'error');
        return;
    }

    if(!(await registerUser(email.value, password.value, currency.value))) {
        showToast('Coś poszło nie tak...', 'error');
        return;
    }

    showToast('Rejestracja zakończona sukcesem! Możesz teraz się zalogować.', 'success');
    setTimeout(() => { document.location.href = '/pages/auth/login/login.html'; }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.register-form');
    form.addEventListener('submit', register);
    
    const currencySelect = document.querySelector('#currencySelect');

    for (const currency of config.supportedCurrencies) {
        const normalizedCurrency = currency.toUpperCase();
        
        const isDefault = normalizedCurrency === 'PLN';
        const option = new Option(normalizedCurrency, normalizedCurrency, isDefault, isDefault);

        currencySelect.add(option);
    }
});
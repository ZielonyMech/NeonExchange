import { registerUser, checkEmailValidity, checkPasswordStrength } from "/scripts/utils/auth.js"
import { config } from "/scripts/config/config.js"
const crypto = window.crypto

async function register(event) {
    event.preventDefault();

    const email = document.querySelector('#email');
    const password = document.querySelector('#password');
    const currency = document.querySelector('#currencySelect');
    const confirmPassword = document.querySelector('#confirmPassword');

    if (!email.value || !password.value || !confirmPassword.value) {
        alert('Proszę wypełnić wszystkie pola!');
        return;
    }

    if (!checkEmailValidity(email.value)) {
        alert('Nieprawidłowy format email!');
        return;
    }

    if(!checkPasswordStrength(password.value)) {
        alert('Hasło musi mieć co najmniej 8 znaków, zawierać małą literę, dużą literę, cyfrę i znak specjalny!');
        return;
    }

    if (password.value !== confirmPassword.value) {
        alert('Hasła nie są identyczne!');
        return;
    }
    
    if(!(await registerUser(email.value, password.value, currency.value))) {
        alert('Cos poszlo nie tak...');
        return;
    }
    
    alert('Rejestracja zakończona sukcesem! Możesz teraz się zalogować.');
    document.location.href = '/pages/auth/login/login.html';
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
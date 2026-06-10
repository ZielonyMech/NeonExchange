import { registerUser, checkEmailValidity, checkPasswordStrength } from "/scripts/utils/auth.js"
import { config } from "/scripts/config/config.js"
import { showToast } from "/styles/popups/popup.js"
const crypto = window.crypto

async function register(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.register-form button[type="submit"]');
    submitBtn.disabled = true;

    const email = document.querySelector('#email');
    const password = document.querySelector('#password');
    const currency = document.querySelector('#currencySelect');
    const confirmPassword = document.querySelector('#confirmPassword');

    if (!email.value || !password.value || !confirmPassword.value) {
        showToast('Proszę wypełnić wszystkie pola!', 'error');
        submitBtn.disabled = false;
        return;
    }

    if (!checkEmailValidity(email.value)) {
        showToast('Nieprawidłowy format email!', 'error');
        submitBtn.disabled = false;
        return;
    }

    if(!checkPasswordStrength(password.value)) {
        showToast('Hasło musi mieć co najmniej 8 znaków, zawierać małą literę, dużą literę, cyfrę i znak specjalny!', 'error');
        submitBtn.disabled = false;
        return;
    }

    if (password.value !== confirmPassword.value) {
        showToast('Hasła nie są identyczne!', 'error');
        submitBtn.disabled = false;
        return;
    }

    if(!(await registerUser(email.value, password.value, currency.value))) {
        showToast('Coś poszło nie tak...', 'error');
        submitBtn.disabled = false;
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

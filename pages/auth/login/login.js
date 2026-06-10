import { setLoggedUser } from "/scripts/globalState.js";
import { hashSomething, getUser, checkEmailValidity, checkPasswordStrength } from "/scripts/utils/auth.js";
import { showToast } from "/styles/popups/popup.js";

const crypto = window.crypto;

async function loginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    if (!email.value || !password.value) {
        showToast('Proszę wypełnić wszystkie pola!', 'error');
        return;
    }

    if (!checkEmailValidity(email.value)) {
        showToast('Nieprawidłowy format email!', 'error');
        return;
    }

    await loginUser({ email: email.value, password: password.value });
}

async function loginUser(user) {
    const foundUser = getUser(user.email);

    const hashedPassword = await hashSomething(user.password, 'SHA-512');

    if (foundUser && foundUser.password === hashedPassword) {
        showToast('Logowanie zakończone sukcesem!', 'success');
        setLoggedUser(foundUser);
        setTimeout(() => { document.location.href = "/"; }, 1500);
        return;
    }

    showToast('Nieprawidłowy email lub hasło!', 'error');
}
     

document.querySelector('.login-form').addEventListener('submit', loginSubmit);
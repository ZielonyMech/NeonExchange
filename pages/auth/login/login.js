import { setLoggedUser } from "/scripts/globalState.js";
import { hashSomething, getUser, checkEmailValidity, checkPasswordStrength } from "/scripts/utils/auth.js";

const crypto = window.crypto;

async function loginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    if (!email.value || !password.value) {
        alert('Proszę wypełnić wszystkie pola!');
        return;
    }

    if (!checkEmailValidity(email.value)) {
        alert('Nieprawidłowy format email!');
        return;
    }

    await loginUser({ email: email.value, password: password.value });
}

async function loginUser(user) {
    const foundUser = getUser(user.email);

    const hashedPassword = await hashSomething(user.password, 'SHA-512');

    if (foundUser && foundUser.password === hashedPassword) {
        alert('Logowanie zakończone sukcesem!');

        setLoggedUser(foundUser);
        document.location.href="/";

        return;
    }

    alert('Nieprawidłowy email lub hasło!');
}
     

document.querySelector('.login-form').addEventListener('submit', loginSubmit);
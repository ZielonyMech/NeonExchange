import { setLoggedUser } from "/scripts/globalState.js";
import { hashSomething, getUser } from "/scripts/utils/auth.js";

const crypto = window.crypto;

async function loginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    await loginUser({ email: email.value, password: password.value });
}

async function loginUser(user) {
    const foundUser = getUser(user.email);

    const hashedPassword = await hashSomething(user.password, 'SHA-512');

    if (foundUser && foundUser.password === hashedPassword) {
        NXPopup.toast({ type: 'success', title: 'Zalogowano', message: 'Logowanie zakończone sukcesem!' });
        setLoggedUser(foundUser);
        document.location.href="/";
        return;
    }

    NXPopup.toast({ type: 'error', title: 'Błąd', message: 'Nieprawidłowy email lub hasło!' });
}
     

document.querySelector('.login-form').addEventListener('submit', loginSubmit);
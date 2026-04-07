import { hashSomething } from "/pages/auth/register/register.js";

const crypto = window.crypto;

async function loginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');

    await loginUser({ email: email.value, password: password.value });
}

async function loginUser(user) {
    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = savedUsers.find(u => u.email === user.email);

    const hashedPassword = await hashSomething(user.password, 'SHA-512');

    if (foundUser && foundUser.password === hashedPassword) {
        alert('Logowanie zakończone sukcesem!');
        return
    }

    alert('Nieprawidłowy email lub hasło!');
}
     

document.querySelector('.login-form').addEventListener('submit', loginSubmit);
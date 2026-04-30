import { hashSomething, checkUserExists } from "/scripts/utils/auth.js"
const crypto = window.crypto

async function register(event) {
    event.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (password.value !== confirmPassword.value) {
        alert('Hasła nie są identyczne!');
        return;
    }

    const hashedPassword = await hashSomething(password.value, 'SHA-512');
    
    const newUser = {
        email: email.value,
        password: hashedPassword,
        balance: 1000,
        ownedAssets: []
    }

    if (checkUserExists(email.value)) {
        return;
    }

    registerUser(newUser);
    alert('Rejestracja zakończona sukcesem! Możesz teraz się zalogować.');
    document.location.href = '/pages/auth/login/login.html';
}

function registerUser(user) {
    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    savedUsers.push(user);
    localStorage.setItem('users', JSON.stringify(savedUsers));
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.register-form');
    if (form) {
        form.addEventListener('submit', register);
    }
});
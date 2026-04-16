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
    }

    if (checkUserExists(email.value)) {
        return;
    }

    registerUser(newUser);
    alert('Rejestracja zakończona sukcesem! Możesz teraz się zalogować.');
    document.location.href = '/pages/auth/login/login.html';
}

export async function hashSomething(text, algorithm) {
    const hashedValue = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));

    return Array.from(new Uint8Array(hashedValue)).map(b => b.toString(16).padStart(2, '0')).join('');
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
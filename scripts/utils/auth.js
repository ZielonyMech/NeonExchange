import { createNewUser } from "/scripts/utils/types.js";

export async function hashSomething(text, algorithm) {
    const hashedValue = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));

    return Array.from(new Uint8Array(hashedValue)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function checkPasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
}

export function checkEmailValidity(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function getUser(userMail) {
    const savedUsers = getAllUsers();
    const foundUser = savedUsers.find(u => u.email === userMail);
    
    return foundUser;
}

export function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

export function checkUserExists(email) {
    const savedUsers = getAllUsers();
    return savedUsers.some(user => user.email === email);
}

export function pushUser(user) {
    const savedUsers = getAllUsers();
    const userExists = checkUserExists(user.email);
    
    if (userExists) return false;
    savedUsers.push(user);

    localStorage.setItem('users', JSON.stringify(savedUsers));

    return true;
}

export async function registerUser(email, password, currency) {
    if (checkUserExists(email)) return false;

    const newUser = await createNewUser(email, password, currency)

    if (!newUser) return false;
    pushUser(newUser);

    return true;
}
export function checkUserExists(email) {
    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    return savedUsers.some(user => user.email === email);
}

export function getUser(userMail) {
    const savedUsers = getAllUsers();
    const foundUser = savedUsers.find(u => u.email === userMail);

    return foundUser;
}

export function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

export async function hashSomething(text, algorithm) {
    const hashedValue = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));

    return Array.from(new Uint8Array(hashedValue)).map(b => b.toString(16).padStart(2, '0')).join('');
}
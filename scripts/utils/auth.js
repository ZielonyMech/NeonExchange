export function checkUserExists(email) {
    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    return savedUsers.some(user => user.email === email);
}

export async function hashSomething(text, algorithm) {
    const hashedValue = await crypto.subtle.digest(algorithm, new TextEncoder().encode(text));

    return Array.from(new Uint8Array(hashedValue)).map(b => b.toString(16).padStart(2, '0')).join('');
}
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

export async function createNewUser(email, password, currency) {
    if (!email || !password) return null

    const hashedPassword = await hashSomething(password, 'SHA-512');
    
    return {
        email: email,
        password: hashedPassword,
        balance: 1000,
        ownedAssets: [],
        transactionHistory: [],
        userCurrency: currency ?? 'PLN',
        creationDate: new Date().toISOString(),
    }
}

export async function registerUser(email, password, currency) {
    if (checkUserExists(email)) return false;

    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const newUser = await createNewUser(email, password, currency)

    if (!newUser) return false
    
    savedUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(savedUsers));

    return true;
}
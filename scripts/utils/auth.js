export function checkUserExists(email) {
    const savedUsers = JSON.parse(localStorage.getItem('users')) || [];
    return savedUsers.some(user => user.email === email);
}
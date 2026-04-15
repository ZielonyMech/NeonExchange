export function setLoggedUser(user) {
    if (user) {
        localStorage.setItem('loggedUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('loggedUser');
    }
}

export function getLoggedUser() {
    const user = localStorage.getItem('loggedUser');
    return user ? JSON.parse(user) : null;
}
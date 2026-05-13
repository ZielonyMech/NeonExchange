import { getUser, getAllUsers } from '/scripts/utils/auth.js'

export function setLoggedUser(user) {
    if (user) {
        localStorage.setItem('loggedUser', JSON.stringify(user));
    } 
}

export function getLoggedUser() {
    const user = localStorage.getItem('loggedUser');
    return user ? JSON.parse(user) : null;
}

export function syncLoggedUser(updatedUser) {
    if (!updatedUser) return;

    if(!getUser(updatedUser.email));

    let siteUsers = getAllUsers();
    const userIndex = siteUsers.findIndex(u => u.email === updatedUser.email);
    
    if (userIndex === -1) return;
    siteUsers[userIndex] = updatedUser;

    localStorage.setItem('loggedUser', JSON.stringify(updatedUser));
    localStorage.setItem('users', JSON.stringify(siteUsers));
}

export function logoutCurrentUser() {
    const loggedUser = getLoggedUser();
    syncLoggedUser(loggedUser);

    localStorage.removeItem('loggedUser');
}
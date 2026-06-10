let toastTimeout;

export function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');

    clearTimeout(toastTimeout);

    toast.innerText = message;

    if (type === 'success') {
        toast.style.backgroundColor = '#00e676';
        toast.style.color = '#000000';
    } else {
        toast.style.backgroundColor = '#ff3d00';
        toast.style.color = '#ffffff';
    }

    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

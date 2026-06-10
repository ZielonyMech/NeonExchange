const MAX_TOASTS = 5;

function getOrCreateContainer() {
    const openDialog = document.querySelector('dialog[open]');
    const parent = openDialog ?? document.body;

    let container = parent.querySelector('#toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        parent.appendChild(container);
    }
    return container;
}

function dismissToast(toast) {
    clearTimeout(toast._dismissTimer);
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
}

export function showToast(message, type = 'error') {
    const container = getOrCreateContainer();

    const visible = [...container.querySelectorAll('.toast:not(.evicting)')];
    if (visible.length >= MAX_TOASTS) {
        const oldest = visible[0];
        clearTimeout(oldest._dismissTimer);
        oldest.classList.add('evicting');
        oldest.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;

    if (type === 'success') {
        toast.style.backgroundColor = '#00e676';
        toast.style.color = '#000000';
    } else {
        toast.style.backgroundColor = '#ff3d00';
        toast.style.color = '#ffffff';
    }

    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    toast._dismissTimer = setTimeout(() => dismissToast(toast), 3000);
}

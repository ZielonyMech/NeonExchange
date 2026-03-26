export async function loadComponent(componentPath, target, event = null) {
    const res = await fetch(componentPath);

    if (!res.ok) {
        throw new Error(`Failed to load component: ${componentPath}`);
    }

    const html = await res.text();
    const container = document.querySelector(target);

    if (!container) {
        throw new Error(`Target element not found: ${target}`);
    }

    container.innerHTML = html;

    if (event) {
        event(container.target);
    }
}
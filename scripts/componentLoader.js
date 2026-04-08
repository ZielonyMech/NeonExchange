export async function loadComponent(componentPath, componentName, componentClass) {
    if (customElements.get(componentName)) {
        return;
    }

    const res = await fetch(componentPath);

    if (!res.ok) {
        throw new Error(`Failed to load component: ${res.statusText}`);
    }

    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const importedTemplate = doc.querySelector(`template#${componentName}-template`);

    if (!importedTemplate) {
        throw new Error(`${componentName} template not found in ${componentPath}`);
    }

    const template = document.createElement('template');
    template.innerHTML = importedTemplate.innerHTML;
    
    customElements.define(componentName, componentClass);
}
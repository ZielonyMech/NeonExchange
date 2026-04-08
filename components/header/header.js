export class AppHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        const res = await fetch('/components/header/header.html');
        
        if (!res.ok) {
            throw new Error(`Failed to load component: ${res.statusText}`);
        }
        
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const headerTemplate = doc.querySelector(`template#app-header-template`);
        
        if (headerTemplate.innerHTML && !this.shadowRoot.innerHTML) {
            this.shadowRoot.appendChild(headerTemplate.content.cloneNode(true));
            this.initHamburger();
        }
    }

    initHamburger() {
        const hamburger = this.shadowRoot.getElementById('hamburger');
        const navMenu = this.shadowRoot.getElementById('navMenu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('active');
                hamburger.setAttribute('aria-expanded', String(isOpen));
            });
        }
    }
}

customElements.define('app-header', AppHeader);

export default AppHeader;

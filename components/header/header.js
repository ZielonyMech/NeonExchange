const headerTemplate = document.createElement('template');
headerTemplate.innerHTML = `
    <style>
        :host {
            display: block;
        }

        .header {
            width: 100%;
            background: #00457c;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            box-sizing: border-box;
            position: relative;
        }

        .header-inner {
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }

        .nav-menu {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            left: auto;
            width: 200px;
            background: #00457c;
            border-radius: 6px;
            box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            padding: 8px;
            box-sizing: border-box;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.2s ease-in-out, opacity 0.2s ease-in-out;
            opacity: 0;
            pointer-events: none;
            z-index: 20;
        }

        .nav-menu.active {
            max-height: 240px;
            opacity: 1;
            pointer-events: auto;
        }

        .nav-menu ul {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .nav-menu a {
            color: white;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            padding: 8px 10px;
            border-radius: 4px;
        }

        .nav-menu a:hover {
            background: rgba(255,255,255,0.1);
            text-decoration: none;
        }

        .hamburger {
            width: 32px;
            height: 26px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: none;
            background: transparent;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
            z-index: 2;
        }

        .hamburger span {
            display: block;
            height: 3px;
            background: white;
            border-radius: 2px;
        }

        .brand {
            font-size: 1rem;
            font-weight: 700;
            color: white;
        }
    </style>

    <header class="header">
        <div class="header-inner">
            <div class="brand"><slot name="brand">NeonExchange</slot></div>
            <button class="hamburger" id="hamburger" aria-label="Przełącz menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <nav class="nav-menu" id="navMenu" aria-label="Główna nawigacja">
                <slot name="nav">
                    <ul>
                        <li><a href="/index.html">Strona główna</a></li>
                        <li><a href="#about">O nas</a></li>
                        <li><a href="#services">Usługi</a></li>
                        <li><a href="#contact">Kontakt</a></li>
                        <li><a href="/pages/auth/login/login.html">Logowanie</a></li>
                    </ul>
                </slot>
            </nav>
        </div>
    </header>
`;

export class AppHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(headerTemplate.content.cloneNode(true));
        this.initHamburger();
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

if (!customElements.get('app-header')) {
    customElements.define('app-header', AppHeader);
}

export default AppHeader;

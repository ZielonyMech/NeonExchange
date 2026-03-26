import { config, components } from "./config/config.js"
import { loadComponent } from "./componentLoader.js";
import { initHamburger } from "/components/header/header.js";

async function bootstrap() {
    console.log('Current config');
    console.log(config);

    try {
        loadComponent(components.header, 'header', initHamburger);
    }
    catch (err) {
        console.error(`Error loading components: ${err.message}`);
    }
    finally {
        console.log('Bootstrapping done!');
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
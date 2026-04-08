import { AppHeader } from "../components/header/header.js";
import { loadComponent } from "./componentLoader.js";

async function bootstrap() {
    try {
        await loadComponent('/components/header/header.html', 'app-header', AppHeader);
    } catch (err) {
        console.error('Bootstrap error:', err.message);
    } finally {
        console.log('Bootstrapping done!');
    }
}

bootstrap();
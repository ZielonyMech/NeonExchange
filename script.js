import { config } from "./scripts/config/config.js"

function bootstrap() {
    console.log('bootstrapping done!');
    console.log(config.supportedCurrencies);
}

bootstrap();
export const config = {
    endpoints: {
        countries: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/country.json",
        currencyRates: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies",
        currencies: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json"
    },
    supportedCurrencies: [
        "eur",
        "pln",
        "czk",
        "usd"
    ]
}

export default config;
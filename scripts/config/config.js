export const config = {
    endpoints: {
        countries: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/country.json",
        currencyRates: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies",
        currencies: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json"
    },
    supportedCurrencies: [
        "usd", "eur", "jpy", "gbp", "chf", "cad", "aud", "sek", "nok", "dkk",
        "sgd", "hkd", "krw", "nzd", "zar", "brl", "mxn", "inr", "rub", "cny",
        "pln", "czk"
    ]
}

export default config;
import { hashSomething } from "/scripts/utils/auth.js";

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email 
 * @property {string} password
 * @property {number} balance
 * @property {string} baseCurrency
 * @property {Date} creationDate
 * @property {Array<Transaction>} transactions
 */

/**
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} baseCurrency
 * @property {number} purchasePrice
 * @property {string} boughtCurrencyName
 * @property {number} boughtAmount
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {Asset} asset
 * @property {Number} netValue
 * @property {Date} buyDate
 * @property {Date | null} sellDate
 */

/**
 * Creates an User object
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} baseCurrency - User's base currency
 * @returns {User | null}
 */
export async function createNewUser(email, password, currency) {
    if (!email || !password) return null

    const hashedPassword = await hashSomething(password, 'SHA-512');
    
    return {
        id: crypto.randomUUID(),
        email: email,
        password: hashedPassword,
        balance: 1000,
        transactions: [],
        baseCurrency: currency ?? 'PLN',
        creationDate: new Date(),
    }
}

/**
 * Creates an Asset object
 * @param {string} baseCurrency - Base currency code
 * @param {number} purchasePrice - Price paid per unit
 * @param {string} boughtCurrencyName - Name of currency purchased
 * @param {number} boughtCurrencyRate - Exchange rate of the purchased currency at the time of purchase
 * @returns {Asset | null}
 */
export function createAsset(baseCurrency, purchasePrice, boughtCurrencyName, boughtCurrencyRate) {
    if (!baseCurrency || !purchasePrice || !boughtCurrencyName || !boughtCurrencyRate) return null;

    return {
        id: crypto.randomUUID(),
        baseCurrency,
        purchasePrice,
        boughtCurrencyName,
        boughtAmount: purchasePrice * boughtCurrencyRate,
    };
}

/**
 * Creates a Transaction object
 * @param {Asset} asset - The asset involved in transaction
 * @param {Number} netValue - Transaction value/profit/loss
 * @param {Date} buyDate - Date when asset was purchased
 * @param {Date | null} sellDate - Date when asset was sold (null if still owned)
 * @returns {Transaction | null}
 */
export function createTransaction(asset, netValue = null, buyDate = new Date(), sellDate = null) {
    return {
        id: crypto.randomUUID(),
        asset,
        netValue,
        buyDate,
        sellDate
    };
}
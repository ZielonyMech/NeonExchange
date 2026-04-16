import { config } from './config/config.js'
import { ArgumentError } from './errors.js';

let pendingRequests = 0;

function setLoading(isLoading, elementClass=".loading") {
  const loadingElement = document.querySelector(elementClass);

  if (loadingElement) {
    loadingElement.hidden = !isLoading;
  } 
  else {
    console.error(`Loading element with class ${elementClass} not found`);
  }
}

export function toggleClass(element, elementClass) {
  if (element.classList.contains(elementClass)) {
    element.classList.remove(elementClass);
  } 
  else {
    element.classList.add(elementClass);
  }
}

export function toggleActive(root, element, elementClass) {
  const children = [...root.children];  

  children.forEach(elem => {
    elem.classList.remove(elementClass);
  })

  element.classList.add(elementClass);
}

export async function withLoading(promiseFn, elementClass=".loader") {
  pendingRequests++;
  setLoading(true, elementClass);

  try {
    return await promiseFn();
  } 
  finally {
    pendingRequests--;
    
    if (pendingRequests <= 0) {
      pendingRequests = 0;
      setLoading(false, elementClass);
    }
  }
}

/**
 * @typedef {{ excludeCode?: string }} CurrencyFilterContext
 * @typedef {{ onlyCodes?: string[] }} CurrencyCodeFilterContext
 */

/**
 * Keeps rows whose `code` is in whitelist; optionally drops the base/excluded code.
 *
 * @param {Array<{ code: string }>} list
 * @param {Array<{ string }>} [whitelist]
 * @param {CurrencyFilterContext} [context]
 */
export function filterCurrenciesWhitelist(list, whitelist, context = {}) {
  const { excludeCode } = context;

  if (!Array.isArray(whitelist) || whitelist.length === 0) throw new ArgumentError("Invalid whitelist!");
  
  whitelist = new Set(whitelist.map((elem) => elem.toLowerCase()))

  return list.filter((elem) => {
    const code = elem.code.toLowerCase();

    if (!whitelist.has(code)) return false;
    if (excludeCode && code === excludeCode.toLowerCase()) return false;

    return true;
  });
}

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
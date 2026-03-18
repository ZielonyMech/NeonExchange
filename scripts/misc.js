import { config } from './config/config.js'

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

export async function withLoading(promiseFn, elementClass=".loading") {
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

export function filterAvailableCurrencies(object) {
  return object.filter(elem =>
    config.supportedCurrencies.includes(elem.code)
  );
}

export function filterAvailableCurrenciesWithohutSelf(object, self) {
  return object.filter(elem =>
    config.supportedCurrencies.includes(elem.code) && elem.code != self
  );
}
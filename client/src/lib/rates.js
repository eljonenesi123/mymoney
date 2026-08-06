import api from './api.js';

export const RATE_CURRENCIES = ['EUR', 'USD', 'GBP'];

export function getRates() {
  return api.get('/rates').then((res) => res.data);
}

export function getRateHistory() {
  return api.get('/rates/history').then((res) => res.data);
}

import api from './api.js';

export function listExpenses(filters = {}) {
  return api.get('/expenses', { params: filters }).then((res) => res.data);
}

export function createExpense(payload) {
  return api.post('/expenses', payload).then((res) => res.data);
}

export function updateExpense(id, payload) {
  return api.put(`/expenses/${id}`, payload).then((res) => res.data);
}

export function deleteExpense(id) {
  return api.delete(`/expenses/${id}`);
}

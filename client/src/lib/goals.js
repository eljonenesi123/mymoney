import api from './api.js';

export function listGoals() {
  return api.get('/goals').then((res) => res.data);
}

export function createGoal(payload) {
  return api.post('/goals', payload).then((res) => res.data);
}

export function updateGoal(id, payload) {
  return api.patch(`/goals/${id}`, payload).then((res) => res.data);
}

export function contributeToGoal(id, amount) {
  return api.post(`/goals/${id}/contribute`, { amount }).then((res) => res.data);
}

export function deleteGoal(id) {
  return api.delete(`/goals/${id}`);
}

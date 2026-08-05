import api from './api.js';

export function listCategories(userId) {
  return api.get('/categories', { params: { userId } }).then((res) => res.data);
}

export function createCategory(payload) {
  return api.post('/categories', payload).then((res) => res.data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}

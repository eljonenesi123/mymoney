import api from './api.js';

export function listCategories() {
  return api.get('/categories').then((res) => res.data);
}

export function createCategory(payload) {
  return api.post('/categories', payload).then((res) => res.data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}

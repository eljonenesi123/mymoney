import api from './api.js';

export function listNotifications() {
  return api.get('/notifications').then((res) => res.data);
}

export function markNotificationRead(id) {
  return api.patch(`/notifications/${id}/read`).then((res) => res.data);
}

export function generateNotifications() {
  return api.post('/notifications/generate').then((res) => res.data);
}

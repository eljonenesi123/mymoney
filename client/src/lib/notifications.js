import api from './api.js';

export function listNotifications(userId) {
  return api.get('/notifications', { params: { userId } }).then((res) => res.data);
}

export function markNotificationRead(id) {
  return api.patch(`/notifications/${id}/read`).then((res) => res.data);
}

export function generateNotifications(userId) {
  return api.post('/notifications/generate', { userId }).then((res) => res.data);
}

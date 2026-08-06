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

// Local-notification permission opt-in. This only lets the app show a
// notification while it's open (e.g. via the service worker's
// `showNotification`) — it does NOT enable notifications while the app is
// closed. True background push (a bill reminder arriving even with the app
// fully closed) needs a backend holding a push subscription and triggering
// it at the right time; that piece isn't built yet. See sw.js for the
// client-side groundwork (push/notificationclick handlers) already in place
// for whenever that backend exists.
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.requestPermission();
}

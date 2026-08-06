import api from './api.js';

export function listBills() {
  return api.get('/bills').then((res) => res.data);
}

export function createBill(payload) {
  return api.post('/bills', payload).then((res) => res.data);
}

export function updateBill(id, payload) {
  return api.patch(`/bills/${id}`, payload).then((res) => res.data);
}

export function payBill(id) {
  return api.post(`/bills/${id}/pay`).then((res) => res.data);
}

export function deleteBill(id) {
  return api.delete(`/bills/${id}`);
}

// Days until due, using UTC day boundaries so this matches across timezones
// the same way the Insights chart's date bucketing does — a negative number
// means overdue by that many days.
export function daysUntilDue(dueDate) {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate);
  const dueUTC = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((dueUTC - today) / 86400000);
}

export function billUrgency(bill) {
  if (bill.paid) return 'paid';
  const days = daysUntilDue(bill.dueDate);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'soon';
  return 'upcoming';
}

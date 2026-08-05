export function formatCurrency(amount) {
  // Albanian Lek is practically always used as whole numbers (no coins in
  // everyday circulation), so no decimal places rather than the ISO
  // default of 2.
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: 'ALL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
}

export function formatDateFull(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

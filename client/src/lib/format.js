export function formatCurrency(amount, currency = 'ALL') {
  const value = amount || 0;

  // Not using Intl's `style: 'currency'` here — it depends on the browser's
  // ICU data having full locale/currency-display info for 'sq-AL', which
  // isn't guaranteed (some Chromium builds only ship "small-icu" and
  // silently fall back to "ALL 1,500" instead of a real Lek format).
  // Plain number grouping is universally supported, so we build the
  // currency string ourselves for a reliable result everywhere.
  if (currency === 'EUR') {
    const formatted = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${formatted} €`;
  }

  // Albanian Lek is practically always used as whole numbers (no coins in
  // everyday circulation), so no decimal places.
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} Lekë`;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date));
}

export function formatDateFull(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

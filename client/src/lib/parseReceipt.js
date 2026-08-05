const TOTAL_KEYWORDS = /total|amount due|balance due|grand total/i;
const SKIP_KEYWORDS = /subtotal|sub-total|change|cash|tax|tip/i;
const MONEY_RE = /\$?\s?(\d{1,5}(?:[.,]\d{2}))\b/g;

function toNumber(str) {
  return parseFloat(str.replace(',', '.'));
}

export function parseReceiptText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let amount = null;

  for (const line of lines) {
    if (TOTAL_KEYWORDS.test(line) && !SKIP_KEYWORDS.test(line)) {
      const matches = [...line.matchAll(MONEY_RE)];
      if (matches.length) {
        amount = toNumber(matches[matches.length - 1][1]);
        break;
      }
    }
  }

  if (amount === null) {
    const allAmounts = [];
    for (const line of lines) {
      if (SKIP_KEYWORDS.test(line)) continue;
      const matches = [...line.matchAll(MONEY_RE)];
      matches.forEach((m) => allAmounts.push(toNumber(m[1])));
    }
    if (allAmounts.length) {
      amount = Math.max(...allAmounts);
    }
  }

  const merchant = lines.length ? guessMerchant(lines) : null;

  return { amount, merchant };
}

function guessMerchant(lines) {
  for (const line of lines.slice(0, 5)) {
    const letters = line.replace(/[^a-zA-Z]/g, '');
    if (letters.length >= 3 && !/receipt|invoice|order/i.test(line)) {
      return toTitleCase(line);
    }
  }
  return null;
}

function toTitleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

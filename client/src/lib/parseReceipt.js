// Matches "Total" in English and the Albanian terms seen on Lek receipts.
const TOTAL_KEYWORDS = /total|totali|shuma|per pagese|për pagesë|amount due|balance due|grand total/i;
// Lines to ignore even if they contain a number that looks like a total —
// subtotal/tax/change lines, in English and Albanian.
const SKIP_KEYWORDS = /subtotal|sub-total|nentotal|nëntotal|change|kusur|cash|kesh|tip|\btvsh\b|tax/i;

// Albanian Lek prices are usually whole numbers (e.g. "1500 Lek" or,
// thousands-separated, "1.500 Lek") but decimals do occasionally appear, so
// this matches both — with an optional "Lek"/"ALL" marker on either side to
// help pick real prices out of OCR noise (phone numbers, dates, etc.).
const MONEY_RE = /(?:lek[eë]?|all|\$)?\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{2,6}(?:[.,]\d{2})?)\s?(?:lek[eë]?|all)?\b/gi;

function toNumber(raw) {
  const parts = raw.trim().split(/[.,]/);
  if (parts.length === 1) return parseFloat(parts[0]);

  const last = parts[parts.length - 1];
  if (last.length === 2) {
    // Trailing 2-digit group reads as cents; everything before it is the
    // whole-number part (with any of its own thousands separators dropped).
    return parseFloat(parts.slice(0, -1).join('') + '.' + last);
  }
  // Otherwise every separator is a thousands grouping, e.g. "1.500.000".
  return parseFloat(parts.join(''));
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
    const letters = line.replace(/[^a-zA-ZëËçÇ]/g, '');
    if (letters.length >= 3 && !/receipt|invoice|order|fature|kupon/i.test(line)) {
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

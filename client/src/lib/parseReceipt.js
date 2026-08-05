// Matches "Total" in English and the Albanian terms seen on Lek receipts.
const TOTAL_KEYWORDS = /total|totali|shuma|per pagese|për pagesë|amount due|balance due|grand total/i;
// Lines to ignore even if they contain a number that looks like a total —
// subtotal/tax/change lines, in English and Albanian.
const SKIP_KEYWORDS = /subtotal|sub-total|nentotal|nëntotal|change|kusur|cash|kesh|tip|\btvsh\b|tax/i;
// Lines that carry a number but aren't a price: dates, and rows labelled as
// a reference/fiscal/ID number rather than an amount. Left unfiltered,
// these routinely got picked up as "the total" — a receipt number or a
// year was often larger than the real total.
const DATE_LINE_RE = /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b/;
const ID_LINE_RE = /nipt|nuis|\bnr\.|numri|fiscal|kupon(?!a)|barkod|barcode|\bora\b|orari|\btel\b|telefon/i;

// Albanian Lek prices are usually whole numbers (e.g. "1500 Lek" or,
// thousands-separated, "1.500 Lek") but decimals do occasionally appear, so
// this matches both — with an optional "Lek"/"ALL" marker on either side to
// help pick real prices out of OCR noise.
const MONEY_RE = /(?:lek[eë]?|all|\$|€)?\s?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{2,6}(?:[.,]\d{2})?)\s?(?:lek[eë]?|all|€)?\b/gi;

function isCandidateLine(line) {
  return !SKIP_KEYWORDS.test(line) && !DATE_LINE_RE.test(line) && !ID_LINE_RE.test(line);
}

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
  let amountLineIndex = -1;
  let amountLineIsLabel = false; // true when the line is just "Total" with no item on it

  // 1) Prefer an explicit "Total" line — most reliable when OCR reads it cleanly.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (TOTAL_KEYWORDS.test(line) && isCandidateLine(line)) {
      const matches = [...line.matchAll(MONEY_RE)];
      if (matches.length) {
        amount = toNumber(matches[matches.length - 1][1]);
        amountLineIndex = i;
        amountLineIsLabel = true;
        break;
      }
    }
  }

  // 2) Fall back to the bottom portion of the receipt — totals print near
  //    the end, after the item list — scanning upward for the first
  //    plausible price rather than grabbing whatever number is largest.
  if (amount === null) {
    const bottomStart = Math.floor(lines.length * 0.4);
    for (let i = lines.length - 1; i >= bottomStart; i--) {
      const line = lines[i];
      if (!isCandidateLine(line)) continue;
      const matches = [...line.matchAll(MONEY_RE)];
      if (matches.length) {
        amount = toNumber(matches[matches.length - 1][1]);
        amountLineIndex = i;
        amountLineIsLabel = false;
        break;
      }
    }
  }

  // 3) Last resort: largest plausible number anywhere on the receipt.
  if (amount === null) {
    let best = null;
    for (let i = 0; i < lines.length; i++) {
      if (!isCandidateLine(lines[i])) continue;
      const matches = [...lines[i].matchAll(MONEY_RE)];
      for (const m of matches) {
        const value = toNumber(m[1]);
        if (best === null || value > best.value) {
          best = { value, index: i };
        }
      }
    }
    if (best) {
      amount = best.value;
      amountLineIndex = best.index;
      amountLineIsLabel = false;
    }
  }

  const merchant = lines.length ? guessMerchant(lines) : null;
  const item = amountLineIndex >= 0
    ? extractItemName(lines, amountLineIndex, amountLineIsLabel)
    : null;

  return { amount, merchant, item };
}

// Guesses the purchased item's name — either from the price line itself
// (when it reads like "Kafe Ekspres  150"), or from the line just above an
// explicit "Total" label, which is normally the last item on the receipt.
function extractItemName(lines, amountLineIndex, amountLineIsLabel) {
  const candidates = amountLineIsLabel
    ? [lines[amountLineIndex - 1]]
    : [lines[amountLineIndex]];

  for (const line of candidates) {
    if (!line) continue;
    if (SKIP_KEYWORDS.test(line) || TOTAL_KEYWORDS.test(line) || ID_LINE_RE.test(line)) continue;

    const stripped = line
      .replace(MONEY_RE, ' ')
      .replace(/[×xX]\s*\d+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const letters = stripped.replace(/[^a-zA-ZëËçÇ]/g, '');
    if (letters.length >= 3) {
      return toTitleCase(stripped);
    }
  }
  return null;
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

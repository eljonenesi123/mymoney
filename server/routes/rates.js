import { Router } from 'express';
import RateCache from '../models/RateCache.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

const BASE = 'ALL';
const TRACKED = ['EUR', 'USD', 'GBP'];
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function fetchFreshRates() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    throw new Error('EXCHANGE_RATE_API_KEY is not set');
  }
  const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${BASE}`);
  const data = await res.json();
  if (data.result !== 'success') {
    throw new Error(data['error-type'] || 'Exchange rate API request failed');
  }
  const rates = {};
  for (const code of TRACKED) {
    if (typeof data.conversion_rates[code] === 'number') {
      rates[code] = data.conversion_rates[code];
    }
  }
  return rates;
}

// Serves rates from a shared 24h cache. If a refresh is due but the live
// fetch fails (API down, monthly quota hit), falls back to the last cached
// values with a `stale: true` flag rather than erroring the page out.
router.get('/', async (req, res, next) => {
  try {
    const cached = await RateCache.findOne({ base: BASE });
    const isFresh = cached && Date.now() - cached.fetchedAt.getTime() < REFRESH_INTERVAL_MS;

    if (isFresh) {
      return res.json({ base: BASE, rates: cached.rates, updatedAt: cached.fetchedAt, stale: false });
    }

    try {
      const rates = await fetchFreshRates();
      const fetchedAt = new Date();
      await RateCache.findOneAndUpdate(
        { base: BASE },
        { base: BASE, rates, fetchedAt },
        { upsert: true },
      );
      return res.json({ base: BASE, rates, updatedAt: fetchedAt, stale: false });
    } catch (fetchErr) {
      if (cached) {
        return res.json({
          base: BASE,
          rates: cached.rates,
          updatedAt: cached.fetchedAt,
          stale: true,
          error: "Couldn't refresh rates — showing the last known values.",
        });
      }
      console.error('Exchange rate fetch failed with no cache available:', fetchErr.message);
      return res.status(502).json({ error: "Couldn't load exchange rates. Try again shortly." });
    }
  } catch (err) {
    next(err);
  }
});

export default router;

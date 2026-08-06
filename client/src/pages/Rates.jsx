import { useEffect, useState } from 'react';
import { getRates, RATE_CURRENCIES } from '../lib/rates.js';
import styles from './Rates.module.css';

const ALL_CODES = ['ALL', ...RATE_CURRENCIES];

const CURRENCY_LABEL = {
  ALL: 'Albanian Lek',
  EUR: 'Euro',
  USD: 'US Dollar',
  GBP: 'British Pound',
};

const CURRENCY_FLAG = {
  ALL: '🇦🇱',
  EUR: '🇪🇺',
  USD: '🇺🇸',
  GBP: '🇬🇧',
};

// 1 ALL = rates[code] units of `code` (server's base is ALL). Extending with
// ALL:1 lets every conversion below go through a single formula regardless
// of whether ALL is the "from", the "to", or the home currency picked.
function convert(fromCode, toCode, ratesExt) {
  const fromInAll = fromCode === 'ALL' ? 1 : 1 / ratesExt[fromCode];
  return fromInAll * ratesExt[toCode];
}

function formatRate(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatUpdated(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

function Rates() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [home, setHome] = useState('ALL');

  useEffect(() => {
    getRates()
      .then(setData)
      .catch(() => setLoadError("Couldn't load exchange rates. Try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  const ratesExt = data ? { ...data.rates, ALL: 1 } : null;
  const otherCodes = ALL_CODES.filter((c) => c !== home);

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Currency</span>
        <h1>Exchange rates</h1>
      </div>

      {!loading && ratesExt && (
        <div className={`card ${styles.homeCard}`}>
          <div>
            <span className="eyebrow">Home currency</span>
            <p className={styles.homeHint}>Rates below are shown relative to this currency.</p>
          </div>
          <select
            className="select"
            value={home}
            onChange={(e) => setHome(e.target.value)}
            aria-label="Home currency"
          >
            {ALL_CODES.map((code) => (
              <option key={code} value={code}>{CURRENCY_FLAG[code]} {code}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading rates…</p>
      ) : loadError ? (
        <div className="empty-state">
          <span className="glyph">💱</span>
          <p>{loadError}</p>
        </div>
      ) : (
        <>
          {data.stale && (
            <div className={`card ${styles.staleNotice}`}>
              ⚠️ {data.error || "Couldn't refresh — showing the last known rates."}
            </div>
          )}

          <div className={styles.rateList}>
            {otherCodes.map((code) => (
              <div key={code} className={`card ${styles.rateCard}`}>
                <div className={styles.rateHead}>
                  <span className={styles.flag} aria-hidden="true">{CURRENCY_FLAG[code]}</span>
                  <div className={styles.rateTitleGroup}>
                    <span className={styles.rateName}>{CURRENCY_LABEL[code]}</span>
                    <span className={styles.rateCode}>{code}</span>
                  </div>
                </div>
                <span className={styles.rateValue}>
                  1 {code} = {formatRate(convert(code, home, ratesExt))} {home}
                </span>
              </div>
            ))}
          </div>

          <p className={styles.updated}>
            Last updated {formatUpdated(data.updatedAt)} · rates refresh at most once every 24 hours
          </p>
        </>
      )}
    </div>
  );
}

export default Rates;

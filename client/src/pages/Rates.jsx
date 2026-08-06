import { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getRates, getRateHistory, RATE_CURRENCIES } from '../lib/rates.js';
import CurrencyBadge from '../components/CurrencyBadge.jsx';
import CurrencyPicker from '../components/CurrencyPicker.jsx';
import styles from './Rates.module.css';

const ALL_CODES = ['ALL', ...RATE_CURRENCIES];

const CURRENCY_LABEL = {
  ALL: 'Albanian Lek',
  EUR: 'Euro',
  USD: 'US Dollar',
  GBP: 'British Pound',
};

// 1 ALL = rates[code] units of `code` (server's base is ALL). Extending
// with ALL:1 lets every conversion go through one formula regardless of
// which currency is "from" or "to".
function convert(fromCode, toCode, ratesExt) {
  const fromInAll = fromCode === 'ALL' ? 1 : 1 / ratesExt[fromCode];
  return fromInAll * ratesExt[toCode];
}

// For display only (the big headline number) — locale-grouped with a comma
// decimal separator.
function formatAmount(value) {
  if (!Number.isFinite(value)) return '';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value);
}

// For the editable <input type="number"> fields — these only accept a
// period decimal separator; writing a locale-formatted "0,96" into one
// gets silently rejected by the browser, leaving the field blank.
function plainAmount(value) {
  if (!Number.isFinite(value)) return '';
  return String(Math.round(value * 10000) / 10000);
}

function formatUpdated(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatChartDate(dateStr) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

function ChartTooltip({ active, payload, to }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <strong>{payload[0].payload.label}</strong>
      <span>{formatAmount(payload[0].value)} {to}</span>
    </div>
  );
}

function Rates() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [from, setFrom] = useState('ALL');
  const [to, setTo] = useState('EUR');
  const [fromAmount, setFromAmount] = useState('1');
  const [toAmount, setToAmount] = useState('');

  useEffect(() => {
    Promise.all([getRates(), getRateHistory().catch(() => [])])
      .then(([ratesData, historyData]) => {
        setData(ratesData);
        setHistory(historyData);
      })
      .catch(() => setLoadError("Couldn't load exchange rates. Try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  const ratesExt = data ? { ...data.rates, ALL: 1 } : null;
  const rate = ratesExt ? convert(from, to, ratesExt) : null;

  // Keep the "to" field in sync whenever the rate, the from-amount, or the
  // currency pair changes — but not the other way while the user is
  // actively typing in "to" (handled separately in handleToAmountChange).
  useEffect(() => {
    if (rate == null) return;
    const parsed = parseFloat(fromAmount);
    setToAmount(Number.isFinite(parsed) ? plainAmount(parsed * rate) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, from, to]);

  function handleFromAmountChange(value) {
    setFromAmount(value);
    const parsed = parseFloat(value);
    setToAmount(rate != null && Number.isFinite(parsed) ? plainAmount(parsed * rate) : '');
  }

  function handleToAmountChange(value) {
    setToAmount(value);
    const parsed = parseFloat(value);
    if (rate != null && Number.isFinite(parsed) && rate !== 0) {
      setFromAmount(plainAmount(parsed / rate));
    } else {
      setFromAmount('');
    }
  }

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  const otherCodes = useMemo(() => ALL_CODES.filter((c) => c !== from), [from]);

  const chartData = useMemo(() => {
    return history.map((point) => {
      const ext = { ...point.rates, ALL: 1 };
      const hasBoth = ext[from] != null && ext[to] != null;
      return {
        label: formatChartDate(point.date),
        value: hasBoth ? convert(from, to, ext) : null,
      };
    }).filter((p) => p.value != null);
  }, [history, from, to]);

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Currency</span>
        <h1>Exchange rates</h1>
      </div>

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

          <div className={`card ${styles.headline}`}>
            <span className={styles.headlineLabel}>1 {CURRENCY_LABEL[from]} =</span>
            <span className={styles.headlineValue}>
              {formatAmount(rate)} {to}
            </span>
            <span className={styles.updated}>Last updated · {formatUpdated(data.updatedAt)}</span>

            <div className={styles.pickerRow}>
              <CurrencyPicker codes={ALL_CODES} value={from} onChange={setFrom} labels={CURRENCY_LABEL} ariaLabel="From currency" />
              <button type="button" className={styles.swapButton} onClick={handleSwap} aria-label="Swap currencies">
                ⇄
              </button>
              <CurrencyPicker codes={ALL_CODES} value={to} onChange={setTo} labels={CURRENCY_LABEL} ariaLabel="To currency" />
            </div>

            <div className={styles.amountRow}>
              <div className={styles.amountField}>
                <CurrencyBadge code={from} />
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                />
              </div>
              <div className={styles.amountField}>
                <CurrencyBadge code={to} />
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  value={toAmount}
                  onChange={(e) => handleToAmountChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={`card ${styles.chartCard}`}>
            <span className="eyebrow">{from} → {to} history</span>
            {chartData.length >= 2 ? (
              <div className={styles.trendChart}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A857" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#D4A857" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(44,62,76,0.1)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#858E92' }} />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Tooltip content={<ChartTooltip to={to} />} cursor={{ stroke: 'rgba(44,62,76,0.18)', strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#D4A857"
                      strokeWidth={2.5}
                      fill="url(#rateFill)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#D4A857', stroke: '#FCFAF5', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className={styles.chartEmpty}>
                Building up rate history — check back after a few daily refreshes for a trend chart.
              </p>
            )}
          </div>

          <div className={styles.quickList}>
            {otherCodes.map((code) => (
              <button
                key={code}
                type="button"
                className={`card ${styles.quickChip} ${code === to ? styles.quickChipActive : ''}`}
                onClick={() => setTo(code)}
              >
                <CurrencyBadge code={code} size={28} />
                <span>{code}</span>
              </button>
            ))}
          </div>

          <p className={styles.hint}>Rates refresh at most once every 24 hours.</p>
        </>
      )}
    </div>
  );
}

export default Rates;

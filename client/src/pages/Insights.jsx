import { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useUser } from '../context/UserContext.jsx';
import { listExpenses } from '../lib/expenses.js';
import { formatCurrency } from '../lib/format.js';
import styles from './Insights.module.css';

// Bucketed in UTC to match how <input type="date"> values are stored
// (new Date('2026-08-05') parses as UTC midnight) — mixing in local-time
// day boundaries here would shift buckets by a day in non-UTC timezones.
function daysAgo(n) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n));
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <strong>{label}</strong>
      <span className="amount">{formatCurrency(payload[0].value, currency)}</span>
    </div>
  );
}

function Insights() {
  const { user } = useUser();
  const currency = user?.currency || 'ALL';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listExpenses(user._id, { startDate: daysAgo(30).toISOString() })
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [user]);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.category?.name || 'Other';
      const existing = map.get(key) || { name: key, value: 0, color: e.category?.color || '#5c584c' };
      existing.value += e.amount;
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [expenses]);

  const trend = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = daysAgo(i);
      days.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' }),
        total: 0,
      });
    }
    const byDay = new Map(days.map((d) => [d.key, d]));
    for (const e of expenses) {
      const key = new Date(e.date).toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (bucket) bucket.total += e.amount;
    }
    return days;
  }, [expenses]);

  const total = byCategory.reduce((sum, c) => sum + c.value, 0);
  const topCategory = byCategory[0];
  const dailyAvg = total / 30;

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Last 30 days</span>
        <h1>Insights</h1>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">📊</span>
          <p>Log a few expenses to see your spending patterns.</p>
        </div>
      ) : (
        <>
          <div className={styles.statRow}>
            <div className={`card ${styles.stat}`}>
              <span className="eyebrow">Daily average</span>
              <span className="amount">{formatCurrency(dailyAvg, currency)}</span>
            </div>
            <div className={`card ${styles.stat}`}>
              <span className="eyebrow">Top category</span>
              <span className={styles.statText}>{topCategory?.name || '—'}</span>
            </div>
          </div>

          <div className={`card ${styles.chartCard}`}>
            <span className="eyebrow">Last 14 days</span>
            <div className={styles.trendChart}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#trendFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#34d399', stroke: '#0b0b0f', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`card ${styles.chartCard}`}>
            <span className="eyebrow">By category</span>
            <ul className={styles.breakdown}>
              {byCategory.map((c) => (
                <li key={c.name} className={styles.breakdownRow}>
                  <div className={styles.breakdownHead}>
                    <span className={styles.breakdownName}>{c.name}</span>
                    <span className="amount">{formatCurrency(c.value, currency)}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${total ? (c.value / total) * 100 : 0}%`, background: c.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Insights;

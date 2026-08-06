import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useUser } from '../context/UserContext.jsx';
import { listExpenses } from '../lib/expenses.js';
import { formatCurrency, formatDate } from '../lib/format.js';
import AffordabilityCheck from '../components/AffordabilityCheck.jsx';
import SpendingSummary from '../components/SpendingSummary.jsx';
import BillReminders from '../components/BillReminders.jsx';
import styles from './Dashboard.module.css';

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className={styles.tooltip}>
      <strong>{item.name}</strong>
      <span className="amount">{formatCurrency(item.value, currency)}</span>
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const currency = user?.currency || 'ALL';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    listExpenses({ startDate: startOfMonth().toISOString() })
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [user]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const e of expenses) {
      const key = e.category?._id || 'other';
      const existing = map.get(key) || { name: e.category?.name || 'Other', value: 0, color: e.category?.color || '#8B8378' };
      existing.value += e.amount;
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [expenses]);

  const recent = useMemo(() => expenses.slice(0, 5), [expenses]);

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">{user?.name}'s overview</span>
        <h1>This month</h1>
      </div>

      <Link to="/add?scan=1" className={`btn btn-primary ${styles.scanButton}`}>
        📷 Scan a receipt
      </Link>

      <BillReminders currency={currency} />

      <SpendingSummary currency={currency} />

      <div className={`card ${styles.totalCard}`}>
        <span className="eyebrow">Total spent</span>
        <span className={styles.totalAmount}>{formatCurrency(total, currency)}</span>
        <hr className="tally-rule" />
        <span className={styles.totalMeta}>{expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} logged</span>
      </div>

      {!loading && byCategory.length > 0 && (
        <div className={`card ${styles.chartCard}`}>
          <span className="eyebrow">By category</span>
          <div className={styles.chartRow}>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="100%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {byCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className={styles.legend}>
              {byCategory.slice(0, 5).map((c) => (
                <li key={c.name} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: c.color }} />
                  <span className={styles.legendName}>{c.name}</span>
                  <span className={styles.legendValue}>{formatCurrency(c.value, currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <AffordabilityCheck remainingBudget={(user?.monthlyIncome || 0) - total} currency={currency} />

      <div>
        <div className={styles.sectionHead}>
          <span className="eyebrow">Recent</span>
          <Link to="/history" className={styles.viewAll}>View all</Link>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <span className="glyph">🧾</span>
            <p>Nothing logged this month yet.</p>
            <Link to="/add" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add your first expense</Link>
          </div>
        ) : (
          <ul className={styles.recentList}>
            {recent.map((e) => (
              <li key={e._id} className={styles.recentRow}>
                <span
                  className={`icon-badge ${styles.recentIcon}`}
                  style={{ background: `color-mix(in srgb, ${e.category?.color || '#8B8378'} 22%, transparent)` }}
                >
                  {e.category?.icon || '🏷️'}
                </span>
                <div className={styles.recentText}>
                  <span className={styles.recentMerchant}>{e.merchant || e.category?.name}</span>
                  <span className={styles.recentMeta}>{formatDate(e.date)}</span>
                </div>
                <span className="amount">−{formatCurrency(e.amount, currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

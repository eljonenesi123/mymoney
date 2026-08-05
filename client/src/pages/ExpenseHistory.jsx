import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { listCategories } from '../lib/categories.js';
import { listExpenses, deleteExpense } from '../lib/expenses.js';
import { formatCurrency, formatDate } from '../lib/format.js';
import styles from './ExpenseHistory.module.css';

const RANGE_OPTIONS = [
  { id: 'all', label: 'All time' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: '90', label: 'Last 90 days' },
];

function ExpenseHistory() {
  const { user } = useUser();
  const currency = user?.currency || 'ALL';
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    listCategories(user._id).then(setCategories);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const filters = {};
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    if (rangeFilter !== 'all') {
      const start = new Date();
      start.setDate(start.getDate() - Number(rangeFilter));
      filters.startDate = start.toISOString();
    }
    listExpenses(user._id, filters)
      .then(setExpenses)
      .finally(() => setLoading(false));
  }, [user, categoryFilter, rangeFilter]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  async function handleDelete(id) {
    setExpenses((prev) => prev.filter((e) => e._id !== id));
    try {
      await deleteExpense(id);
    } catch {
      // refetch on failure to stay consistent
      listExpenses(user._id).then(setExpenses);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Every entry</span>
        <h1>History</h1>
      </div>

      <div className={styles.filters}>
        <select
          className="select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select
          className="select"
          value={rangeFilter}
          onChange={(e) => setRangeFilter(e.target.value)}
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      {!loading && expenses.length > 0 && (
        <div className={styles.totalRow}>
          <span className="eyebrow">Total</span>
          <span className={`amount ${styles.totalAmount}`}>{formatCurrency(total, currency)}</span>
        </div>
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">🧾</span>
          <p>No expenses here yet.</p>
          <Link to="/add" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add one</Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {expenses.map((expense) => (
            <li key={expense._id} className={`card ${styles.row}`}>
              <div className={styles.rowMain}>
                <span
                  className={`icon-badge ${styles.categoryDot}`}
                  style={{ background: `color-mix(in srgb, ${expense.category?.color || '#9ca3af'} 22%, transparent)` }}
                >
                  {expense.category?.icon || '🏷️'}
                </span>
                <div className={styles.rowText}>
                  <span className={styles.merchant}>{expense.merchant || expense.category?.name || 'Expense'}</span>
                  <span className={styles.meta}>{formatDate(expense.date)} · {expense.category?.name}</span>
                </div>
              </div>
              <div className={styles.rowEnd}>
                <span className="amount">−{formatCurrency(expense.amount, currency)}</span>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(expense._id)}
                  aria-label="Delete expense"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseHistory;

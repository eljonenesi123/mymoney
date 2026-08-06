import { useEffect, useMemo, useState } from 'react';
import { listExpenses } from '../lib/expenses.js';
import { formatCurrency } from '../lib/format.js';
import styles from './SpendingSummary.module.css';

function daysAgo(n) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n));
}

function sumAndTopCategory(expenses) {
  let total = 0;
  const byCategory = new Map();
  for (const e of expenses) {
    total += e.amount;
    const key = e.category?.name || 'Other';
    byCategory.set(key, (byCategory.get(key) || 0) + e.amount);
  }
  let topCategory = null;
  let topAmount = 0;
  for (const [name, amount] of byCategory) {
    if (amount > topAmount) {
      topCategory = name;
      topAmount = amount;
    }
  }
  return { total, topCategory };
}

function changeLabel(current, previous) {
  if (previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return 'same as last time';
  return pct > 0 ? `up ${pct}% from last time` : `down ${Math.abs(pct)}% from last time`;
}

function SpendingSummary({ currency }) {
  const [expenses, setExpenses] = useState(null);

  useEffect(() => {
    listExpenses({ startDate: daysAgo(60).toISOString() }).then(setExpenses);
  }, []);

  const stats = useMemo(() => {
    if (!expenses) return null;

    const weekStart = daysAgo(7);
    const twoWeeksStart = daysAgo(14);
    const monthStart = daysAgo(30);
    const twoMonthsStart = daysAgo(60);

    const inRange = (e, start, end) => {
      const d = new Date(e.date);
      return d >= start && (!end || d < end);
    };

    const thisWeek = expenses.filter((e) => inRange(e, weekStart));
    const lastWeek = expenses.filter((e) => inRange(e, twoWeeksStart, weekStart));
    const thisMonth = expenses.filter((e) => inRange(e, monthStart));
    const lastMonth = expenses.filter((e) => inRange(e, twoMonthsStart, monthStart));

    const week = sumAndTopCategory(thisWeek);
    const lastWeekTotal = sumAndTopCategory(lastWeek).total;
    const month = sumAndTopCategory(thisMonth);
    const lastMonthTotal = sumAndTopCategory(lastMonth).total;

    return {
      week: { ...week, changeLabel: changeLabel(week.total, lastWeekTotal) },
      month: { ...month, changeLabel: changeLabel(month.total, lastMonthTotal) },
    };
  }, [expenses]);

  if (!stats) return null;
  if (stats.week.total === 0 && stats.month.total === 0) return null;

  return (
    <div className={`card ${styles.card}`}>
      <span className="eyebrow">Spending recap</span>
      <div className={styles.row}>
        <div className={styles.col}>
          <span className={styles.period}>This week</span>
          <span className={`amount ${styles.total}`}>{formatCurrency(stats.week.total, currency)}</span>
          {stats.week.topCategory && (
            <span className={styles.detail}>Mostly {stats.week.topCategory}</span>
          )}
          {stats.week.changeLabel && <span className={styles.change}>{stats.week.changeLabel}</span>}
        </div>
        <div className={styles.divider} />
        <div className={styles.col}>
          <span className={styles.period}>This month</span>
          <span className={`amount ${styles.total}`}>{formatCurrency(stats.month.total, currency)}</span>
          {stats.month.topCategory && (
            <span className={styles.detail}>Mostly {stats.month.topCategory}</span>
          )}
          {stats.month.changeLabel && <span className={styles.change}>{stats.month.changeLabel}</span>}
        </div>
      </div>
    </div>
  );
}

export default SpendingSummary;

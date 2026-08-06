import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import { listGoals, createGoal, contributeToGoal, deleteGoal } from '../lib/goals.js';
import { formatCurrency } from '../lib/format.js';
import styles from './Goals.module.css';

function GoalCard({ goal, currency, onContribute, onDelete }) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const achieved = Boolean(goal.achievedAt);

  async function handleContribute(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setSubmitting(true);
    try {
      await onContribute(goal._id, value);
      setAmount('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`card ${styles.goalCard}`}>
      <div className={styles.goalHead}>
        <div className={styles.goalTitleGroup}>
          <span className={styles.goalName}>{goal.name}</span>
          <span className={styles.goalTarget}>
            {formatCurrency(goal.currentAmount, currency)} of {formatCurrency(goal.targetAmount, currency)}
          </span>
        </div>
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => onDelete(goal._id)}
          aria-label={`Delete ${goal.name}`}
        >
          ✕
        </button>
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        <span className={styles.progressPig} style={{ left: `${pct}%` }} aria-hidden="true">🐷</span>
      </div>
      <div className={styles.progressMeta}>
        <span>{pct}%</span>
        {achieved && <span className={styles.achievedBadge}>🎉 Goal reached!</span>}
      </div>

      {!achieved && (
        <form onSubmit={handleContribute} className={styles.contributeRow}>
          <input
            type="number"
            inputMode={currency === 'ALL' ? 'numeric' : 'decimal'}
            min="0"
            step={currency === 'ALL' ? '1' : '0.01'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Add contribution"
            className="input"
          />
          <button type="submit" className="btn btn-secondary" disabled={submitting || !amount}>
            Add
          </button>
        </form>
      )}
    </div>
  );
}

function Goals() {
  const { user } = useUser();
  const currency = user?.currency || 'ALL';
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    listGoals()
      .then(setGoals)
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    setCreating(true);
    setError('');
    try {
      const goal = await createGoal({ name: name.trim(), targetAmount: parseFloat(target) });
      setGoals((prev) => [goal, ...prev]);
      setName('');
      setTarget('');
      setShowForm(false);
    } catch {
      setError("Couldn't create that goal. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleContribute(id, amount) {
    const updated = await contributeToGoal(id, amount);
    setGoals((prev) => prev.map((g) => (g._id === id ? updated : g)));
  }

  async function handleDelete(id) {
    setGoals((prev) => prev.filter((g) => g._id !== id));
    try {
      await deleteGoal(id);
    } catch {
      listGoals().then(setGoals);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Savings goals</span>
        <h1>Goals</h1>
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className={`card ${styles.form}`}>
          <div className="field">
            <label htmlFor="goalName">Goal name</label>
            <input
              id="goalName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New laptop"
              className="input"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="goalTarget">Target amount</label>
            <input
              id="goalTarget"
              type="number"
              inputMode={currency === 'ALL' ? 'numeric' : 'decimal'}
              min="1"
              step={currency === 'ALL' ? '1' : '0.01'}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={currency === 'ALL' ? '0 Lekë' : '0.00 €'}
              className="input"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary" disabled={creating || !name.trim() || !target}>
              {creating ? 'Creating…' : 'Create goal'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New goal
        </button>
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : goals.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">🐷</span>
          <p>No savings goals yet — start one above.</p>
        </div>
      ) : (
        <div className={styles.goalList}>
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              currency={currency}
              onContribute={handleContribute}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Goals;

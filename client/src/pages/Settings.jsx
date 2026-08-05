import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import styles from './Settings.module.css';

const CURRENCIES = [
  { code: 'ALL', label: 'Lek (ALL)' },
  { code: 'EUR', label: 'Euro (€)' },
];

function Settings() {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const [income, setIncome] = useState(user?.monthlyIncome ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'ALL');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateUser({ monthlyIncome: income ? parseFloat(income) : 0, currency });
      setSaved(true);
    } catch {
      setError("Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Profile</span>
        <h1>Settings</h1>
      </div>

      <div className={`card ${styles.card}`}>
        <span className="eyebrow">Name</span>
        <p className={styles.name}>{user?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className={`card ${styles.form}`}>
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setSaved(false);
            }}
            className="select"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="income">Monthly income</label>
          <input
            id="income"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={income}
            onChange={(e) => {
              setIncome(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. 120000"
            className="input"
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {saved && <p className={styles.saved}>Saved.</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
        Back
      </button>
    </div>
  );
}

export default Settings;

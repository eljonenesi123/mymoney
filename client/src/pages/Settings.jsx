import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import styles from './Settings.module.css';

const CURRENCIES = [
  { code: 'ALL', label: 'Lek (ALL)' },
  { code: 'EUR', label: 'Euro (€)' },
];

function Settings() {
  const { user, updateUser, upgradeGuest, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [income, setIncome] = useState(user?.monthlyIncome ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'ALL');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [upgradeUsername, setUpgradeUsername] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

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

  async function handleUpgrade(e) {
    e.preventDefault();
    setUpgrading(true);
    setUpgradeError('');
    try {
      await upgradeGuest(upgradeUsername.trim(), upgradePassword);
    } catch (err) {
      setUpgradeError(err.response?.data?.error || "Couldn't create your account. Try again.");
    } finally {
      setUpgrading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/onboarding', { replace: true });
  }

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Profile</span>
        <h1>Settings</h1>
      </div>

      <div className={`card ${styles.card}`}>
        <span className="eyebrow">{user?.isGuest ? 'Guest name' : 'Username'}</span>
        <p className={styles.name}>{user?.isGuest ? user?.name : user?.username}</p>
      </div>

      <div className={`card ${styles.themeCard}`}>
        <div>
          <span className="eyebrow">Appearance</span>
          <p className={styles.themeLabel}>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="Toggle dark mode"
          className={styles.themeToggle}
          data-on={theme === 'dark'}
          onClick={toggleTheme}
        >
          <span className={styles.themeToggleThumb} />
        </button>
      </div>

      {user?.isGuest && (
        <form onSubmit={handleUpgrade} className={`card ${styles.form}`}>
          <span className="eyebrow">Save your data</span>
          <p className={styles.hint}>
            You're using a guest session — it only lives on this device. Create a username and
            password to keep your data and sign in anywhere.
          </p>
          <div className="field">
            <label htmlFor="upgradeUsername">Username</label>
            <input
              id="upgradeUsername"
              type="text"
              value={upgradeUsername}
              onChange={(e) => setUpgradeUsername(e.target.value)}
              placeholder="e.g. jordan_r"
              autoCapitalize="none"
              autoCorrect="off"
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="upgradePassword">Password</label>
            <input
              id="upgradePassword"
              type="password"
              value={upgradePassword}
              onChange={(e) => setUpgradePassword(e.target.value)}
              placeholder="At least 6 characters"
              className="input"
            />
          </div>
          {upgradeError && <p className={styles.error}>{upgradeError}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={upgrading || !upgradeUsername.trim() || !upgradePassword}
          >
            {upgrading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}

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

      <button type="button" className="btn btn-danger" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}

export default Settings;

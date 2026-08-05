import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import styles from './Settings.module.css';

const CURRENCIES = [
  { code: 'ALL', label: 'Lek (ALL)' },
  { code: 'EUR', label: 'Euro (€)' },
];

function Settings() {
  const { user, updateUser, startUpgrade, verifyUpgrade, resendUpgradeCode, logout } = useUser();
  const navigate = useNavigate();
  const [income, setIncome] = useState(user?.monthlyIncome ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'ALL');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [upgradeStep, setUpgradeStep] = useState('form'); // form | verify
  const [upgradeUsername, setUpgradeUsername] = useState('');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeCode, setUpgradeCode] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeNotice, setUpgradeNotice] = useState('');

  function apiErrorMessage(err, fallback) {
    return err.response?.data?.error || fallback;
  }

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

  async function handleStartUpgrade(e) {
    e.preventDefault();
    setUpgrading(true);
    setUpgradeError('');
    try {
      await startUpgrade(upgradeUsername.trim(), upgradeEmail.trim(), upgradePassword);
      setUpgradeStep('verify');
    } catch (err) {
      setUpgradeError(apiErrorMessage(err, "Couldn't create your account. Try again."));
    } finally {
      setUpgrading(false);
    }
  }

  async function handleVerifyUpgrade(e) {
    e.preventDefault();
    setUpgrading(true);
    setUpgradeError('');
    try {
      await verifyUpgrade(upgradeCode.trim());
    } catch (err) {
      setUpgradeError(apiErrorMessage(err, "Couldn't verify that code. Try again."));
    } finally {
      setUpgrading(false);
    }
  }

  async function handleResendUpgradeCode() {
    setUpgradeError('');
    setUpgradeNotice('');
    try {
      await resendUpgradeCode();
      setUpgradeNotice('Sent a new code.');
    } catch (err) {
      setUpgradeError(apiErrorMessage(err, "Couldn't resend the code."));
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
        {!user?.isGuest && user?.email && <p className={styles.email}>{user.email}</p>}
      </div>

      {user?.isGuest && upgradeStep === 'form' && (
        <form onSubmit={handleStartUpgrade} className={`card ${styles.form}`}>
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
            <label htmlFor="upgradeEmail">Email</label>
            <input
              id="upgradeEmail"
              type="email"
              value={upgradeEmail}
              onChange={(e) => setUpgradeEmail(e.target.value)}
              placeholder="you@example.com"
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
            disabled={upgrading || !upgradeUsername.trim() || !upgradeEmail.trim() || !upgradePassword}
          >
            {upgrading ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      )}

      {user?.isGuest && upgradeStep === 'verify' && (
        <form onSubmit={handleVerifyUpgrade} className={`card ${styles.form}`}>
          <span className="eyebrow">Check your email</span>
          <p className={styles.hint}>
            We sent a 6-digit code to <strong>{upgradeEmail}</strong>.
          </p>
          <div className="field">
            <label htmlFor="upgradeCode">Verification code</label>
            <input
              id="upgradeCode"
              type="text"
              inputMode="numeric"
              value={upgradeCode}
              onChange={(e) => setUpgradeCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="input"
            />
          </div>
          {upgradeError && <p className={styles.error}>{upgradeError}</p>}
          {upgradeNotice && <p className={styles.saved}>{upgradeNotice}</p>}
          <button type="submit" className="btn btn-primary" disabled={upgrading || !upgradeCode.trim()}>
            {upgrading ? 'Verifying…' : 'Verify and finish'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResendUpgradeCode}
            disabled={upgrading}
          >
            Resend code
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

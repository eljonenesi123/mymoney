import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import styles from './Onboarding.module.css';

function Onboarding() {
  const [mode, setMode] = useState('choose'); // choose | signup | signin | guest | income
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { register, login, continueAsGuest, updateUser } = useUser();
  const navigate = useNavigate();

  function apiErrorMessage(err, fallback) {
    return err.response?.data?.error || fallback;
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register(username.trim(), password);
      setSubmitting(false);
      setMode('income');
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't create your account. Try again."));
      setSubmitting(false);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Incorrect username or password.'));
      setSubmitting(false);
    }
  }

  function handleGuestName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    continueAsGuest(name.trim())
      .then(() => {
        setSubmitting(false);
        setMode('income');
      })
      .catch(() => {
        setError("Couldn't start your session. Try again.");
        setSubmitting(false);
      });
  }

  async function finishWithIncome(incomeValue) {
    setSubmitting(true);
    setError('');
    try {
      await updateUser({ monthlyIncome: incomeValue });
      navigate('/', { replace: true });
    } catch {
      setError("Couldn't save. Try again.");
      setSubmitting(false);
    }
  }

  function handleIncomeSubmit(e) {
    e.preventDefault();
    finishWithIncome(income ? parseFloat(income) : 0);
  }

  if (mode === 'income') {
    return (
      <div className={styles.container}>
        <span className={`eyebrow ${styles.mark}`}>MyMoney</span>
        <h1 className={styles.title}>What's your monthly income?</h1>
        <p className={styles.subtitle}>
          We'll use this to tell you what you can afford. You can change it anytime.
        </p>
        <form onSubmit={handleIncomeSubmit} className={styles.form}>
          <div className="field">
            <label htmlFor="income">Monthly income</label>
            <input
              id="income"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 120000"
              autoFocus
              className="input"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Opening your ledger…' : 'Start tracking'}
          </button>
          <button
            type="button"
            className={styles.skipLink}
            onClick={() => finishWithIncome(0)}
            disabled={submitting}
          >
            Skip for now
          </button>
        </form>
      </div>
    );
  }

  if (mode === 'signup' || mode === 'signin') {
    const isSignUp = mode === 'signup';
    return (
      <div className={styles.container}>
        <span className={`eyebrow ${styles.mark}`}>MyMoney</span>
        <h1 className={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className={styles.subtitle}>
          {isSignUp ? 'Pick a username and password to save your data.' : 'Sign in to pick up where you left off.'}
        </p>
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className={styles.form}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jordan_r"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              className="input"
            />
          </div>
          {isSignUp && (
            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type it again"
                className="input"
              />
            </div>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            disabled={submitting || !username.trim() || !password}
            className="btn btn-primary"
          >
            {submitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
          <button
            type="button"
            className={styles.skipLink}
            onClick={() => {
              setMode('choose');
              setError('');
            }}
            disabled={submitting}
          >
            Back
          </button>
        </form>
      </div>
    );
  }

  if (mode === 'guest') {
    return (
      <div className={styles.container}>
        <span className={`eyebrow ${styles.mark}`}>MyMoney</span>
        <h1 className={styles.title}>What should we call you?</h1>
        <p className={styles.subtitle}>
          Guest sessions stay on this device only — no account needed.
        </p>
        <form onSubmit={handleGuestName} className={styles.form}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan"
              autoFocus
              className="input"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={submitting || !name.trim()} className="btn btn-primary">
            {submitting ? 'Starting…' : 'Continue'}
          </button>
          <button
            type="button"
            className={styles.skipLink}
            onClick={() => {
              setMode('choose');
              setError('');
            }}
            disabled={submitting}
          >
            Back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={`eyebrow ${styles.mark}`}>MyMoney</span>
      <h1 className={styles.title}>Know where it went.</h1>
      <p className={styles.subtitle}>Snap a receipt, we'll do the tallying.</p>
      <div className={styles.choiceStack}>
        <button type="button" className="btn btn-primary" onClick={() => setMode('signup')}>
          Create an account
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setMode('signin')}>
          Sign in
        </button>
        <button type="button" className={styles.guestLink} onClick={() => setMode('guest')}>
          Continue as guest
        </button>
      </div>
    </div>
  );
}

export default Onboarding;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import styles from './Onboarding.module.css';

function Onboarding() {
  const [step, setStep] = useState('name'); // name | income
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { createUser } = useUser();
  const navigate = useNavigate();

  function handleNameSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('income');
  }

  async function finishOnboarding(incomeValue) {
    setSubmitting(true);
    setError('');
    try {
      await createUser(name.trim(), incomeValue);
      navigate('/', { replace: true });
    } catch {
      setError("Couldn't create your account. Try again.");
      setSubmitting(false);
    }
  }

  function handleIncomeSubmit(e) {
    e.preventDefault();
    finishOnboarding(income ? parseFloat(income) : 0);
  }

  if (step === 'income') {
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
              inputMode="decimal"
              min="0"
              step="0.01"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="e.g. 4200"
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
            onClick={() => finishOnboarding(0)}
            disabled={submitting}
          >
            Skip for now
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={`eyebrow ${styles.mark}`}>MyMoney</span>
      <h1 className={styles.title}>Know where it went.</h1>
      <p className={styles.subtitle}>Snap a receipt, we'll do the tallying. What's your name?</p>
      <form onSubmit={handleNameSubmit} className={styles.form}>
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
        <button type="submit" disabled={!name.trim()} className="btn btn-primary">
          Continue
        </button>
      </form>
    </div>
  );
}

export default Onboarding;

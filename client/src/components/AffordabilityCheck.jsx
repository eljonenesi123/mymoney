import { useState } from 'react';
import { formatCurrency } from '../lib/format.js';
import styles from './AffordabilityCheck.module.css';

function AffordabilityCheck({ remainingBudget, currency = 'ALL' }) {
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState(null);

  function handleCheck(e) {
    e.preventDefault();
    const numericPrice = parseFloat(price);
    if (!numericPrice || numericPrice <= 0) return;

    const after = remainingBudget - numericPrice;
    setResult({ item: itemName.trim() || 'this', price: numericPrice, after });
  }

  return (
    <div className="card">
      <span className="eyebrow">Can I afford this?</span>
      <form onSubmit={handleCheck} className={styles.form}>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item, e.g. New headphones"
          className={`input ${styles.itemInput}`}
        />
        <div className={styles.priceRow}>
          <input
            type="number"
            inputMode={currency === 'ALL' ? 'numeric' : 'decimal'}
            min="0"
            step={currency === 'ALL' ? '1' : '0.01'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={currency === 'ALL' ? '0 Lekë' : '0.00 €'}
            className="input"
          />
          <button type="submit" className="btn btn-primary" disabled={!price}>
            Check
          </button>
        </div>
      </form>

      {result && (
        <div className={styles.result} data-afford={result.after >= 0}>
          {result.after >= 0 ? (
            <p>
              Yes! You'd have <strong>{formatCurrency(result.after, currency)}</strong> left this month.
            </p>
          ) : (
            <p>
              This would put you <strong>{formatCurrency(Math.abs(result.after), currency)}</strong> over budget.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AffordabilityCheck;

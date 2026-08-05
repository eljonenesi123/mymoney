import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { listCategories, createCategory } from '../lib/categories.js';
import { createExpense } from '../lib/expenses.js';
import api from '../lib/api.js';
import ReceiptScanner from '../components/ReceiptScanner.jsx';
import CategoryPicker from '../components/CategoryPicker.jsx';
import styles from './AddExpense.module.css';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function AddExpense() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoOpenScan = searchParams.get('scan') === '1';
  const [categories, setCategories] = useState([]);
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [scanNotice, setScanNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (!user) return;
    listCategories(user._id).then((cats) => {
      setCategories(cats);
      if (cats.length && !categoryId) setCategoryId(cats[0]._id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleScanned({ amount: scannedAmount, merchant: scannedMerchant, file }) {
    setReceiptFile(file);
    const found = [];
    if (scannedAmount != null) {
      setAmount(String(scannedAmount));
      found.push('amount');
    }
    if (scannedMerchant) {
      setMerchant(scannedMerchant);
      found.push('merchant');
    }
    setScanNotice(
      found.length
        ? `Filled in ${found.join(' and ')} from the receipt — check it over.`
        : "Couldn't make out the total — fill it in below.",
    );
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const category = await createCategory({
        userId: user._id,
        name: newCategoryName.trim(),
        icon: '🏷️',
        color: '#60a5fa',
      });
      setCategories((prev) => [...prev, category]);
      setCategoryId(category._id);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch {
      setError("Couldn't create that category.");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !categoryId) return;

    setSubmitting(true);
    setError('');
    try {
      let receiptImageUrl = null;
      if (receiptFile) {
        const formData = new FormData();
        formData.append('receipt', receiptFile);
        const res = await api.post('/uploads/receipt', formData);
        receiptImageUrl = res.data.url;
      }

      await createExpense({
        userId: user._id,
        amount: parseFloat(amount),
        category: categoryId,
        merchant: merchant.trim(),
        date,
        note: note.trim(),
        receiptImageUrl,
      });

      navigate('/history');
    } catch {
      setError("Couldn't save this expense. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">New entry</span>
        <h1>Add expense</h1>
      </div>

      <ReceiptScanner onScanned={handleScanned} autoOpen={autoOpenScan} />
      {scanNotice && <p className={styles.scanNotice}>{scanNotice}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0 Lekë"
            className="input"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="merchant">Merchant</label>
          <input
            id="merchant"
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Corner Market"
            className="input"
          />
        </div>

        <div className="field">
          <label>Category</label>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
          {showNewCategory ? (
            <div className={styles.newCategoryRow}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="input"
                autoFocus
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
              >
                Add
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addCategoryLink}
              onClick={() => setShowNewCategory(true)}
            >
              + New category
            </button>
          )}
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="note">Note (optional)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth remembering"
            className="textarea"
            rows={2}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting || !amount || !categoryId}>
          {submitting ? 'Saving…' : 'Save expense'}
        </button>
      </form>
    </div>
  );
}

export default AddExpense;

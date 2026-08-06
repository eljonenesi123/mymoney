import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import { listBills, createBill, updateBill, payBill, deleteBill, billUrgency, daysUntilDue } from '../lib/bills.js';
import { formatCurrency, formatDateFull } from '../lib/format.js';
import styles from './Bills.module.css';

const RECURRENCE_OPTIONS = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function dueLabel(bill) {
  const days = daysUntilDue(bill.dueDate);
  if (days < 0) return `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

function BillCard({ bill, currency, onPay, onDelete, onEdit }) {
  const urgency = billUrgency(bill);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(bill.name);
  const [amount, setAmount] = useState(String(bill.amount));
  const [dueDate, setDueDate] = useState(bill.dueDate.slice(0, 10));
  const [recurrence, setRecurrence] = useState(bill.recurrence);
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onEdit(bill._id, { name: name.trim(), amount: parseFloat(amount), dueDate, recurrence });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className={`card ${styles.editForm}`}>
        <div className="field">
          <label htmlFor={`name-${bill._id}`}>Name</label>
          <input id={`name-${bill._id}`} className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`amount-${bill._id}`}>Amount</label>
          <input
            id={`amount-${bill._id}`}
            type="number"
            inputMode={currency === 'ALL' ? 'numeric' : 'decimal'}
            min="0"
            step={currency === 'ALL' ? '1' : '0.01'}
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`due-${bill._id}`}>Due date</label>
          <input id={`due-${bill._id}`} type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`rec-${bill._id}`}>Repeats</label>
          <select id={`rec-${bill._id}`} className="select" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
            {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className={styles.formActions}>
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim() || !amount}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className={`card ${styles.billCard} ${styles[urgency]}`}>
      <div className={styles.billHead}>
        <div className={styles.billTitleGroup}>
          <span className={styles.billName}>{bill.name}</span>
          <span className={styles.billMeta}>
            {formatDateFull(bill.dueDate)}
            {bill.recurrence !== 'one-time' && ` · ${bill.recurrence}`}
          </span>
        </div>
        <span className={styles.billAmount}>{formatCurrency(bill.amount, currency)}</span>
      </div>

      <div className={styles.billFoot}>
        {bill.paid ? (
          <span className={styles.paidLabel}>✓ Paid</span>
        ) : (
          <span className={styles.urgencyLabel}>{dueLabel(bill)}</span>
        )}
        <div className={styles.billActions}>
          <button type="button" className={styles.iconButton} onClick={() => setEditing(true)} aria-label={`Edit ${bill.name}`}>
            ✎
          </button>
          <button type="button" className={styles.iconButton} onClick={() => onDelete(bill._id)} aria-label={`Delete ${bill.name}`}>
            ✕
          </button>
        </div>
      </div>

      {!bill.paid && (
        <button type="button" className="btn btn-secondary" onClick={() => onPay(bill._id)}>
          Mark as paid
        </button>
      )}
    </div>
  );
}

function Bills() {
  const { user } = useUser();
  const currency = user?.currency || 'ALL';
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState('one-time');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    listBills().then(setBills).finally(() => setLoading(false));
  }, [user]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !amount || !dueDate) return;
    setCreating(true);
    setError('');
    try {
      const bill = await createBill({ name: name.trim(), amount: parseFloat(amount), dueDate, recurrence });
      setBills((prev) => [...prev, bill].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
      setName('');
      setAmount('');
      setDueDate('');
      setRecurrence('one-time');
      setShowForm(false);
    } catch {
      setError("Couldn't add that bill. Try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handlePay(id) {
    const updated = await payBill(id);
    setBills((prev) => prev.map((b) => (b._id === id ? updated : b)).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
  }

  async function handleEdit(id, payload) {
    const updated = await updateBill(id, payload);
    setBills((prev) => prev.map((b) => (b._id === id ? updated : b)).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
  }

  async function handleDelete(id) {
    setBills((prev) => prev.filter((b) => b._id !== id));
    try {
      await deleteBill(id);
    } catch {
      listBills().then(setBills);
    }
  }

  const unpaid = bills.filter((b) => !b.paid);
  const paid = bills.filter((b) => b.paid && b.recurrence === 'one-time');

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Recurring bills</span>
        <h1>Bills</h1>
      </div>

      {showForm ? (
        <form onSubmit={handleCreate} className={`card ${styles.form}`}>
          <div className="field">
            <label htmlFor="billName">Bill name</label>
            <input
              id="billName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rent"
              className="input"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="billAmount">Amount due</label>
            <input
              id="billAmount"
              type="number"
              inputMode={currency === 'ALL' ? 'numeric' : 'decimal'}
              min="0"
              step={currency === 'ALL' ? '1' : '0.01'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={currency === 'ALL' ? '0 Lekë' : '0.00 €'}
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="billDueDate">Due date</label>
            <input
              id="billDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="billRecurrence">Repeats</label>
            <select id="billRecurrence" className="select" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary" disabled={creating || !name.trim() || !amount || !dueDate}>
              {creating ? 'Adding…' : 'Add bill'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          + New bill
        </button>
      )}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : bills.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">📅</span>
          <p>No bills yet — add one above.</p>
        </div>
      ) : (
        <>
          {unpaid.length > 0 && (
            <div className={styles.billList}>
              {unpaid.map((bill) => (
                <BillCard key={bill._id} bill={bill} currency={currency} onPay={handlePay} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </div>
          )}
          {paid.length > 0 && (
            <div>
              <span className={styles.sectionLabel}>Paid</span>
              <div className={styles.billList}>
                {paid.map((bill) => (
                  <BillCard key={bill._id} bill={bill} currency={currency} onPay={handlePay} onDelete={handleDelete} onEdit={handleEdit} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Bills;

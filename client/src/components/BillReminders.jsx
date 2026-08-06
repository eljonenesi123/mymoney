import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBills, payBill, billUrgency } from '../lib/bills.js';
import { formatCurrency } from '../lib/format.js';
import styles from './BillReminders.module.css';

function dueLabel(bill, urgency) {
  if (urgency === 'overdue') return `${bill.name} — overdue`;
  return `${bill.name} due soon`;
}

function BillReminders({ currency }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBills().then(setBills).finally(() => setLoading(false));
  }, []);

  async function handlePay(id) {
    setBills((prev) => prev.filter((b) => b._id !== id));
    try {
      await payBill(id);
    } catch {
      listBills().then(setBills);
    }
  }

  if (loading) return null;

  const due = bills
    .filter((b) => !b.paid && ['overdue', 'soon'].includes(billUrgency(b)))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (due.length === 0) return null;

  return (
    <div className={styles.wrap}>
      {due.map((bill) => {
        const urgency = billUrgency(bill);
        return (
          <div key={bill._id} className={`card ${styles.reminder} ${styles[urgency]}`}>
            <span className={styles.icon} aria-hidden="true">{urgency === 'overdue' ? '⚠️' : '📅'}</span>
            <div className={styles.text}>
              <span className={styles.title}>{dueLabel(bill, urgency)}</span>
              <span className={styles.sub}>{formatCurrency(bill.amount, currency)} · <Link to="/bills" className={styles.link}>view bills</Link></span>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => handlePay(bill._id)}>
              Mark paid
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default BillReminders;

import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import { listNotifications, markNotificationRead, generateNotifications } from '../lib/notifications.js';
import styles from './Notifications.module.css';

const TYPE_ICON = {
  budget_warning: '⚠️',
  weekly_summary: '📈',
  info: '🔔',
};

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Notifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    generateNotifications(user._id)
      .catch(() => {})
      .finally(() => {
        listNotifications(user._id)
          .then(setNotifications)
          .finally(() => setLoading(false));
      });
  }, [user]);

  async function handleRead(id) {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // ignore — will self-correct on next load
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <span className="eyebrow">Alerts &amp; summaries</span>
        <h1>Notifications</h1>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <span className="glyph">🔔</span>
          <p>Nothing to report — check back after you've logged some expenses.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li
              key={n._id}
              className={styles.item}
              data-unread={!n.read}
              onClick={() => !n.read && handleRead(n._id)}
            >
              <span className={styles.icon}>{TYPE_ICON[n.type] || '🔔'}</span>
              <div className={styles.text}>
                <p className={styles.message}>{n.message}</p>
                <span className={styles.time}>{timeAgo(n.createdAt)}</span>
              </div>
              {!n.read && <span className={styles.dot} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notifications;

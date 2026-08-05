import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext.jsx';
import api from '../lib/api.js';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/add', label: 'Add', icon: '➕', end: false },
  { to: '/history', label: 'History', icon: '📜', end: false },
  { to: '/insights', label: 'Insights', icon: '📊', end: false },
];

function Layout() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function fetchUnread() {
      api.get('/notifications', { params: { userId: user._id } })
        .then((res) => {
          if (!cancelled) setUnreadCount(res.data.filter((n) => !n.read).length);
        })
        .catch(() => {});
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <span className={styles.brandMark}>●</span>MyMoney
        </span>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.bellButton}
            onClick={() => navigate('/settings')}
            aria-label="Settings"
          >
            ⚙️
          </button>
          <button
            type="button"
            className={styles.bellButton}
            onClick={() => navigate('/notifications')}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          >
            🔔
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? styles.navActive : styles.navLink)}
          >
            <span className={styles.navIcon} aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Layout;

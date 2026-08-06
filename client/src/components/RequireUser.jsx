import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import styles from './RequireUser.module.css';

function RequireUser({ children }) {
  const { user, loading, connectionError } = useUser();

  if (loading) return null;

  // We have a token but couldn't reach the server after retrying (likely a
  // cold-starting backend or a spotty connection) — show a retry screen
  // instead of bouncing to onboarding, which would look like the account
  // and its data vanished.
  if (connectionError) {
    return (
      <div className={styles.container}>
        <span className={styles.icon}>📡</span>
        <h1 className={styles.title}>Reconnecting…</h1>
        <p className={styles.subtitle}>
          Having trouble reaching the server. Your account and data are safe — this can happen
          right after the app's been closed for a while.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!user) return <Navigate to="/onboarding" replace />;

  return children;
}

export default RequireUser;

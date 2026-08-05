import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';

function RequireUser({ children }) {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return <Navigate to="/onboarding" replace />;

  return children;
}

export default RequireUser;

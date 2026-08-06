import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import RequireUser from './components/RequireUser.jsx';
import Layout from './components/Layout.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddExpense from './pages/AddExpense.jsx';
import ExpenseHistory from './pages/ExpenseHistory.jsx';
import Insights from './pages/Insights.jsx';
import Bills from './pages/Bills.jsx';
import Rates from './pages/Rates.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  const [splashPhase, setSplashPhase] = useState('visible'); // visible | fading | done

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashPhase('fading'), 1500);
    const doneTimer = setTimeout(() => setSplashPhase('done'), 1850);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              element={
                <RequireUser>
                  <Layout />
                </RequireUser>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddExpense />} />
              <Route path="/history" element={<ExpenseHistory />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/goals" element={<Navigate to="/add?tab=goals" replace />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/rates" element={<Rates />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        {splashPhase !== 'done' && <SplashScreen fadingOut={splashPhase === 'fading'} />}
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;

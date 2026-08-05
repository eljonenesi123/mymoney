import { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken, clearToken } from '../lib/api.js';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleSignedOut() {
      setUser(null);
    }
    window.addEventListener('auth:signed-out', handleSignedOut);
    return () => window.removeEventListener('auth:signed-out', handleSignedOut);
  }, []);

  async function startRegister(username, email, password) {
    await api.post('/auth/register/start', { username, email, password });
  }

  async function verifyRegister(email, code) {
    const res = await api.post('/auth/register/verify', { email, code });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function resendRegisterCode(email) {
    return api.post('/auth/register/resend', { email });
  }

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function continueAsGuest(name) {
    const res = await api.post('/auth/guest', { name });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function startUpgrade(username, email, password) {
    await api.post('/auth/upgrade/start', { username, email, password });
  }

  async function verifyUpgrade(code) {
    const res = await api.post('/auth/upgrade/verify', { code });
    setUser(res.data);
    return res.data;
  }

  function resendUpgradeCode() {
    return api.post('/auth/upgrade/resend');
  }

  async function updateUser(updates) {
    const res = await api.patch('/users/me', updates);
    setUser(res.data);
    return res.data;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        startRegister,
        verifyRegister,
        resendRegisterCode,
        login,
        continueAsGuest,
        startUpgrade,
        verifyUpgrade,
        resendUpgradeCode,
        updateUser,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

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

  async function register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
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

  async function upgradeGuest(username, email, password) {
    const res = await api.post('/auth/upgrade', { username, email, password });
    setUser(res.data);
    return res.data;
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
      value={{ user, loading, register, login, continueAsGuest, upgradeGuest, updateUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

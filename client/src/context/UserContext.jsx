import { createContext, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken, clearToken } from '../lib/api.js';

const UserContext = createContext(null);

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]; // ~31s total — covers a cold Render backend waking up

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when we have a token but couldn't confirm it with the server after
  // retrying — distinct from "no session at all", so the UI can say
  // "reconnecting" instead of bouncing to onboarding and implying the
  // account/data is gone.
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function rehydrate() {
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
          const res = await api.get('/auth/me');
          if (!cancelled) {
            setUser(res.data);
            setConnectionError(false);
          }
          return;
        } catch (err) {
          // Only an explicit 401 means the token itself is bad — anything
          // else (network error, timeout, 502/503 from a cold-starting
          // host) is a connectivity problem, not a sign-out, so the token
          // must NOT be cleared for those cases.
          if (err.response?.status === 401) {
            clearToken();
            if (!cancelled) setConnectionError(false);
            return;
          }
          if (attempt < RETRY_DELAYS_MS.length) {
            await wait(RETRY_DELAYS_MS[attempt]);
          }
        }
      }
      if (!cancelled) setConnectionError(true);
    }

    rehydrate().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleSignedOut() {
      setUser(null);
    }
    window.addEventListener('auth:signed-out', handleSignedOut);
    return () => window.removeEventListener('auth:signed-out', handleSignedOut);
  }, []);

  async function register(username, password) {
    const res = await api.post('/auth/register', { username, password });
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

  async function upgradeGuest(username, password) {
    const res = await api.post('/auth/upgrade', { username, password });
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
      value={{
        user,
        loading,
        connectionError,
        register,
        login,
        continueAsGuest,
        upgradeGuest,
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

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';

const UserContext = createContext(null);

const STORAGE_KEY = 'expense-tracker:userId';

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setLoading(false);
      return;
    }

    api.get(`/users/${storedId}`)
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function createUser(name, monthlyIncome) {
    const res = await api.post('/users', { name, monthlyIncome });
    localStorage.setItem(STORAGE_KEY, res.data._id);
    setUser(res.data);
    return res.data;
  }

  async function updateUser(updates) {
    const res = await api.patch(`/users/${user._id}`, updates);
    setUser(res.data);
    return res.data;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, loading, createUser, updateUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

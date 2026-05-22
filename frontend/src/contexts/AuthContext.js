import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

function formatApiErrorDetail(detail) {
  if (detail == null) return 'Algo salió mal. Por favor intenta de nuevo.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        const orig = err.config;
        if (err.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
          orig._retry = true;
          try {
            await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
            orig.withCredentials = true;
            return axios(orig);
          } catch {
            setUser(null);
          }
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch (error) { setUser(null); } finally { setLoading(false); }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { email, password, name }, { withCredentials: true });
      setUser(data);
      return { success: true };
    } catch (error) { return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message }; }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      setUser(data);
      return { success: true };
    } catch (error) { return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message }; }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) { console.error('Logout error:', error); }
  };

  return <AuthContext.Provider value={{ user, loading, register, login, logout, checkAuth }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
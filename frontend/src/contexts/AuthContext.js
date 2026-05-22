import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = 'iv_access_token';
const REFRESH_KEY = 'iv_refresh_token';

function getStoredToken() { return localStorage.getItem(TOKEN_KEY); }
function getStoredRefresh() { return localStorage.getItem(REFRESH_KEY); }
function saveTokens(access, refresh) {
  if (access) localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function authHeader() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatApiError(error) {
  if (!error?.response) return 'No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.';
  const detail = error.response?.data?.detail;
  if (detail == null) return 'Algo salió mal. Por favor intenta de nuevo.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e?.msg ?? JSON.stringify(e))).filter(Boolean).join(' ');
  if (detail?.msg) return detail.msg;
  return String(detail);
}

function toUser(data) {
  return data && typeof data === 'object' && data._id ? data : null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authGenRef = useRef(0);

  // Inyecta el token en todos los requests automáticamente
  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      const token = getStoredToken();
      if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  // Axios interceptor: si un request falla con 401, intenta refresh con localStorage
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        const orig = err.config;
        if (err.response?.status === 401 && !orig._retry && !orig.url?.includes('/auth/')) {
          orig._retry = true;
          const refresh = getStoredRefresh();
          if (refresh) {
            try {
              const { data } = await axios.post(`${API}/auth/refresh`, { refresh_token: refresh });
              saveTokens(data.access_token, data.refresh_token);
              orig.headers = { ...orig.headers, ...authHeader() };
              return axios(orig);
            } catch {
              clearTokens();
              setUser(null);
            }
          } else {
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
    const gen = ++authGenRef.current;
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API}/auth/me`);
      setUser(toUser(data));
    } catch (err) {
      if (authGenRef.current !== gen) return;
      if (err.response?.status === 401) {
        const refresh = getStoredRefresh();
        if (refresh) {
          try {
            const { data: refreshData } = await axios.post(`${API}/auth/refresh`, { refresh_token: refresh });
            saveTokens(refreshData.access_token, refreshData.refresh_token);
            const { data } = await axios.get(`${API}/auth/me`);
            if (authGenRef.current === gen) setUser(toUser(data));
          } catch {
            if (authGenRef.current === gen) { clearTokens(); setUser(null); }
          }
        } else {
          clearTokens();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    try {
      const { data } = await axios.post(`${API}/auth/register`, { email, password, name });
      saveTokens(data.access_token, data.refresh_token);
      authGenRef.current++;
      setUser(toUser(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiError(error) };
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      saveTokens(data.access_token, data.refresh_token);
      authGenRef.current++;
      setUser(toUser(data));
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiError(error) };
    }
  };

  const logout = async () => {
    clearTokens();
    setUser(null);
    try { await axios.post(`${API}/auth/logout`); } catch { /* best effort */ }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

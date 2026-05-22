// src/context/DarkModeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('iv-dark') === '1'; } catch { return false; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('iv-dark', dark);
    try { localStorage.setItem('iv-dark', dark ? '1' : '0'); } catch (_) {}
  }, [dark]);

  return (
    <DarkModeContext.Provider value={{ dark, setDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import { lightColors, darkColors } from '../styles/colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Carrega preferência salva
  useEffect(() => {
    (async () => {
      const settings = await loadData(STORAGE_KEYS.SETTINGS);
      if (settings?.theme === 'dark') setIsDark(true);
    })();
  }, []);

  // Alterna tema e persiste
  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    const settings = (await loadData(STORAGE_KEYS.SETTINGS)) || {};
    await saveData(STORAGE_KEYS.SETTINGS, { ...settings, theme: next ? 'dark' : 'light' });
  };

  // Objeto de cores derivado do tema atual
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const value = useMemo(() => ({ isDark, toggleTheme, colors }), [isDark, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Hook de conveniência
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}

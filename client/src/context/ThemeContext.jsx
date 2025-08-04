import React, { createContext, useState, useEffect } from 'react';
import { THEMES } from '../utils/constants';
import { logWarn } from '../utils/logger.js';

// Clé sécurisée pour le localStorage
const THEME_STORAGE_KEY = 'segarow_theme';

export const ThemeContext = createContext({
  theme: THEMES.DARK,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === THEMES.LIGHT ? THEMES.LIGHT : THEMES.DARK;
    } catch (error) {
      // En cas d'erreur localStorage, utiliser le thème par défaut
      return THEMES.DARK;
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme === THEMES.LIGHT ? 'light' : 'dark');
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // En cas d'erreur localStorage, continuer sans stockage
      logWarn('Erreur lors du stockage du thème:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 
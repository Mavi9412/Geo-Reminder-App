import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@geo_theme';

export const THEMES = {
  dark: {
    mode: 'dark',
    bg: '#0d0d1a',
    card: '#1a1a2e',
    card2: '#16213e',
    border: '#2d2d4e',
    text: '#ffffff',
    textSub: '#a0aec0',
    textMuted: '#4a5568',
    accent: '#4c6ef5',
    accentLight: 'rgba(76,110,245,0.2)',
    success: '#48bb78',
    danger: '#e53e3e',
    warning: '#ed8936',
    tabBar: '#1a1a2e',
    header: '#0d0d1a',
    input: '#16213e',
    inputBorder: '#2d2d4e',
  },
  light: {
    mode: 'light',
    bg: '#f0f2f5',
    card: '#ffffff',
    card2: '#f7fafc',
    border: '#e2e8f0',
    text: '#1a202c',
    textSub: '#718096',
    textMuted: '#a0aec0',
    accent: '#4c6ef5',
    accentLight: 'rgba(76,110,245,0.1)',
    success: '#48bb78',
    danger: '#e53e3e',
    warning: '#ed8936',
    tabBar: '#ffffff',
    header: '#1a1a2e',
    input: '#ffffff',
    inputBorder: '#e2e8f0',
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEMES.dark);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'light') setTheme(THEMES.light);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme.mode === 'dark' ? THEMES.light : THEMES.dark;
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next.mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

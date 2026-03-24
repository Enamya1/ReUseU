/**
 * Theme Context
 * Manages app theme (light/dark mode)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: typeof lightColors;
}

// Light theme colors (matching web platform)
const lightColors = {
  // Background colors
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',
  surfaceTertiary: '#EBEBEB',
  
  // Text colors
  text: '#141414',
  textSecondary: '#737373',
  textTertiary: '#A3A3A3',
  textInverse: '#FFFFFF',
  
  // Primary colors (black/white minimalist theme)
  primary: '#000000',
  primaryForeground: '#FFFFFF',
  
  // Secondary colors
  secondary: '#242424',
  secondaryForeground: '#FFFFFF',
  
  // Tertiary colors
  tertiary: '#3D3D3D',
  tertiaryForeground: '#FFFFFF',
  
  // Navy
  navy: '#1A1A1A',
  navyForeground: '#FFFFFF',
  
  // Status colors
  success: '#2E2E2E',
  successForeground: '#FFFFFF',
  warning: '#4D4D4D',
  warningForeground: '#FFFFFF',
  destructive: '#333333',
  destructiveForeground: '#FFFFFF',
  
  // Border
  border: '#D9D9D9',
  borderLight: '#EBEBEB',
  
  // Input
  input: '#F3F3F3',
  inputBorder: '#D9D9D9',
  
  // Muted
  muted: '#EBEBEB',
  mutedForeground: '#737373',
  
  // Accent
  accent: '#F5F5F5',
  accentForeground: '#1F1F1F',
  
  // Card
  card: '#FFFFFF',
  cardForeground: '#141414',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowLarge: 'rgba(0, 0, 0, 0.16)',
};

// Dark theme colors
const darkColors = {
  // Background colors
  background: '#000000',
  surface: '#0A0A0A',
  surfaceSecondary: '#141414',
  surfaceTertiary: '#1F1F1F',
  
  // Text colors
  text: '#FAFAFA',
  textSecondary: '#A6A6A6',
  textTertiary: '#6B6B6B',
  textInverse: '#000000',
  
  // Primary colors
  primary: '#FFFFFF',
  primaryForeground: '#000000',
  
  // Secondary colors
  secondary: '#2E2E2E',
  secondaryForeground: '#FAFAFA',
  
  // Tertiary colors
  tertiary: '#424242',
  tertiaryForeground: '#FAFAFA',
  
  // Navy
  navy: '#141414',
  navyForeground: '#FAFAFA',
  
  // Status colors
  success: '#484848',
  successForeground: '#FAFAFA',
  warning: '#595959',
  warningForeground: '#FAFAFA',
  destructive: '#4D4D4D',
  destructiveForeground: '#FAFAFA',
  
  // Border
  border: '#2E2E2E',
  borderLight: '#1F1F1F',
  
  // Input
  input: '#1A1A1A',
  inputBorder: '#2E2E2E',
  
  // Muted
  muted: '#1F1F1F',
  mutedForeground: '#A6A6A6',
  
  // Accent
  accent: '#282828',
  accentForeground: '#FAFAFA',
  
  // Card
  card: '#0A0A0A',
  cardForeground: '#FAFAFA',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowLarge: 'rgba(0, 0, 0, 0.5)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY) as ThemeMode | null;
        if (saved) {
          setThemeModeState(saved);
        }
      } catch {
        // Ignore errors
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    themeMode,
    setThemeMode,
    isDark,
    colors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { lightColors, darkColors };

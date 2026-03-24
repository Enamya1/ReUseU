/**
 * Theme Colors
 * Design tokens matching the web platform's minimalist black/white theme
 */

export const colors = {
  // Light theme
  light: {
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
    success: '#16A34A',
    successForeground: '#FFFFFF',
    warning: '#CA8A04',
    warningForeground: '#FFFFFF',
    destructive: '#DC2626',
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
    
    // White
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  
  // Dark theme
  dark: {
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
    success: '#22C55E',
    successForeground: '#FFFFFF',
    warning: '#EAB308',
    warningForeground: '#FFFFFF',
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',
    
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
    
    // White
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
};

export type ColorTheme = typeof colors.light;

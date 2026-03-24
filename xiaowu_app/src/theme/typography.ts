/**
 * Theme Typography
 * Typography scale and font configurations
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: 'Inter',
    mono: 'monospace',
    display: 'Montserrat',
  },
  
  // Font sizes
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
  
  // Predefined text styles
  styles: {
    // Headings
    h1: {
      fontFamily: 'Montserrat',
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'Montserrat',
      fontSize: 30,
      fontWeight: '600' as const,
      lineHeight: 1.25,
    },
    h3: {
      fontFamily: 'Montserrat',
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'Montserrat',
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
    },
    
    // Body text
    body: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodySmall: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodyLarge: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 1.6,
    },
    
    // Labels
    label: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 1.4,
    },
    labelSmall: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 1.4,
    },
    
    // Caption
    caption: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
    captionSmall: {
      fontFamily: 'Inter',
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
    
    // Button text
    button: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 1,
    },
    buttonLarge: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1,
    },
    buttonSmall: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 1,
    },
    
    // Price/numeric text
    price: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
    priceLarge: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: '700' as const,
      lineHeight: 1.2,
    },
    
    // Tab bar labels
    tabBarLabel: {
      fontFamily: 'Inter',
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 1.2,
    },
  },
};

export type Typography = typeof typography;

/**
 * Theme Index
 * Central export point for all theme values
 */

import { colors, ColorTheme } from './colors';
import { spacing, Spacing } from './spacing';
import { typography, Typography } from './typography';
import { shadows, ShadowTheme } from './shadows';

export { colors, spacing, typography, shadows };

export type { ColorTheme, Spacing, Typography, ShadowTheme };

/**
 * Complete theme object
 */
export const theme = {
  colors,
  spacing,
  typography,
  shadows,
};

/**
 * Create a combined theme for a specific mode
 */
export const createTheme = (isDark: boolean) => ({
  colors: isDark ? colors.dark : colors.light,
  spacing,
  typography,
  shadows: isDark ? shadows.dark : shadows.light,
  isDark,
});

export type Theme = ReturnType<typeof createTheme>;

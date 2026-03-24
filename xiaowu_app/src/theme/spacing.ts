/**
 * Theme Spacing
 * Consistent spacing scale based on 4px grid with responsive scaling
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for scaling (iPhone 6/7/8 as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 667;

// Responsive scaling functions
const scale = (size: number): number => (SCREEN_WIDTH / BASE_WIDTH) * size;
const verticalScale = (size: number): number => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size: number, factor: number = 0.5): number => size + (scale(size) - size) * factor;

// Device size categories
const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;
const IS_MEDIUM_DEVICE = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
const IS_LARGE_DEVICE = SCREEN_WIDTH >= 414;

export const spacing = {
  // Base units (with responsive scaling)
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(32),
  '4xl': moderateScale(40),
  '5xl': moderateScale(48),
  '6xl': moderateScale(64),
  '7xl': moderateScale(80),
  '8xl': moderateScale(96),
  
  // Component-specific
  screenPadding: moderateScale(16),
  cardPadding: moderateScale(16),
  listItemPadding: moderateScale(12),
  buttonPadding: moderateScale(12),
  inputPadding: moderateScale(12),
  
  // Border radius
  radius: {
    none: 0,
    sm: moderateScale(4),
    md: moderateScale(8),
    lg: moderateScale(12),
    xl: moderateScale(16),
    '2xl': moderateScale(24),
    full: 9999,
  },
  
  // Icon sizes
  icon: {
    xs: moderateScale(12),
    sm: moderateScale(16),
    md: moderateScale(20),
    lg: moderateScale(24),
    xl: moderateScale(32),
    '2xl': moderateScale(40),
    '3xl': moderateScale(48),
  },
  
  // Avatar sizes
  avatar: {
    sm: moderateScale(32),
    md: moderateScale(40),
    lg: moderateScale(48),
    xl: moderateScale(64),
    '2xl': moderateScale(80),
  },
  
  // Button heights
  buttonHeight: {
    sm: moderateScale(32),
    md: moderateScale(40),
    lg: moderateScale(48),
    xl: moderateScale(56),
  },
  
  // Input heights
  inputHeight: {
    sm: moderateScale(36),
    md: moderateScale(44),
    lg: moderateScale(52),
  },
  
  // Header heights
  headerHeight: moderateScale(56),
  tabBarHeight: IS_SMALL_DEVICE ? 60 : 70,
  statusBarHeight: 44,
  
  // Responsive utilities
  scale,
  verticalScale,
  moderateScale,
  
  // Device info
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: IS_SMALL_DEVICE,
  isMediumDevice: IS_MEDIUM_DEVICE,
  isLargeDevice: IS_LARGE_DEVICE,
};

export type Spacing = typeof spacing;

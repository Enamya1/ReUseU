/**
 * Custom Hooks Index
 * Central export point for all custom hooks
 */

// Re-export context hooks
export { useAuth } from '../contexts/AuthContext';
export { useFavorites } from '../contexts/FavoritesContext';
export { useCurrency } from '../contexts/CurrencyContext';
export { useTheme } from '../contexts/ThemeContext';

// Custom utility hooks
export * from './useLocation';
export * from './useToast';
export * from './useProducts';

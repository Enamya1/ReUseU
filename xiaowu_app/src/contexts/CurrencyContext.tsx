/**
 * Currency Context
 * Manages currency selection and conversion
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appConfig } from '../config';

// Currency exchange rates (base: CNY)
const DEFAULT_RATES: Record<string, number> = {
  CNY: 1,
  USD: 0.14,
  EUR: 0.13,
  GBP: 0.11,
  JPY: 21.5,
  KRW: 188.5,
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
};

const SELECTED_CURRENCY_KEY = 'selected_currency';

interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  convertPrice: (price: number, fromCurrency?: string) => number;
  formatPrice: (price: number, currency?: string) => string;
  formatWithSelectedCurrency: (price: number, fromCurrency?: string) => string;
  formatSelectedCurrencyParts: (price: number, fromCurrency?: string) => { amount: string; currency: string };
  rates: Record<string, number>;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>(appConfig.defaultCurrency);
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved currency preference
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const saved = await AsyncStorage.getItem(SELECTED_CURRENCY_KEY);
        if (saved && appConfig.supportedCurrencies.includes(saved)) {
          setSelectedCurrencyState(saved);
        }
      } catch {
        // Ignore errors
      }
    };
    loadCurrency();
  }, []);

  const setSelectedCurrency = useCallback(async (currency: string) => {
    setSelectedCurrencyState(currency);
    try {
      await AsyncStorage.setItem(SELECTED_CURRENCY_KEY, currency);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const convertPrice = useCallback((price: number, fromCurrency?: string): number => {
    const from = fromCurrency || appConfig.defaultCurrency;
    const fromRate = rates[from] || 1;
    const toRate = rates[selectedCurrency] || 1;
    
    // Convert to base currency first, then to target
    const basePrice = price / fromRate;
    return basePrice * toRate;
  }, [rates, selectedCurrency]);

  const formatPrice = useCallback((price: number, currency?: string): string => {
    const code = currency || selectedCurrency;
    const symbol = CURRENCY_SYMBOLS[code] || code;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(price));
    return `${symbol}${formatted}`;
  }, [selectedCurrency]);

  const formatWithSelectedCurrency = useCallback((price: number, fromCurrency?: string): string => {
    const converted = convertPrice(price, fromCurrency);
    return formatPrice(converted, selectedCurrency);
  }, [convertPrice, formatPrice, selectedCurrency]);

  const formatSelectedCurrencyParts = useCallback((price: number, fromCurrency?: string): { amount: string; currency: string } => {
    const converted = convertPrice(price, fromCurrency);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(converted));
    const symbol = CURRENCY_SYMBOLS[selectedCurrency] || selectedCurrency;
    return { amount: formatted, currency: symbol };
  }, [convertPrice, selectedCurrency]);

  const value: CurrencyContextType = {
    selectedCurrency,
    setSelectedCurrency,
    convertPrice,
    formatPrice,
    formatWithSelectedCurrency,
    formatSelectedCurrencyParts,
    rates,
    isLoading,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

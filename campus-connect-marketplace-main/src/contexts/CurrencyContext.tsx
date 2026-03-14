import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatPrice } from '@/lib/mockData';

type CurrencyRateMap = Record<string, number>;

type CurrencyOption = {
  code: string;
  symbol: string;
  rate: number;
};

type CurrencyContextValue = {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  currencies: CurrencyOption[];
  isLoading: boolean;
  convertPrice: (amount: number, sourceCurrency?: string) => number;
  formatWithSelectedCurrency: (amount: number, sourceCurrency?: string) => string;
  formatSelectedCurrencyParts: (amount: number, sourceCurrency?: string) => { amount: string; currency: string };
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

const STORAGE_KEY = 'selected-currency';
const DEFAULT_CURRENCY = 'CNY';
const CRYPTO_CODES = new Set([
  'BTC',
  'ETH',
  'DOGE',
  'BNB',
  'SOL',
  'XRP',
  'ADA',
  'DOT',
  'AVAX',
  'LTC',
  'BCH',
  'XMR',
  'TRX',
  'ETC',
  'ATOM',
  'NEAR',
  'ICP',
  'LINK',
  'MATIC',
  'SHIB',
]);

const readStoredCurrency = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) return DEFAULT_CURRENCY;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : DEFAULT_CURRENCY;
};

const normalizeCurrencyCode = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();
  if (trimmed === '¥' || trimmed === '￥') return 'CNY';
  if (trimmed === '$') return 'USD';
  if (trimmed === '€') return 'EUR';
  if (trimmed === '£') return 'GBP';
  return undefined;
};

const getCurrencySymbol = (code: string): string => {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(1);
    const currencyPart = parts.find((part) => part.type === 'currency')?.value;
    if (currencyPart && currencyPart.trim().length > 0) {
      return currencyPart;
    }
  } catch {
    return code;
  }
  return code;
};

const isSupportedCurrencyCode = (code: string): boolean => {
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(1);
    return true;
  } catch {
    return false;
  }
};

const getCurrencyMarker = (code: string): string => {
  const symbol = getCurrencySymbol(code);
  if (symbol === 'CN¥' || symbol === '￥') {
    return '¥';
  }
  if (symbol.toUpperCase() === code.toUpperCase()) {
    return code.toLowerCase();
  }
  return symbol;
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>(readStoredCurrency);
  const [rates, setRates] = useState<CurrencyRateMap>({ [DEFAULT_CURRENCY]: 1 });
  const [baseCurrency, setBaseCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://cdn.moneyconvert.net/api/latest.json', {
          method: 'GET',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to fetch currency rates');
        }
        const payload = (await response.json()) as { base?: string; rates?: Record<string, number> };
        if (!active) return;
        const fetchedBase =
          typeof payload.base === 'string' && /^[A-Za-z]{3}$/.test(payload.base)
            ? payload.base.toUpperCase()
            : DEFAULT_CURRENCY;
        const nextRates: CurrencyRateMap = { [fetchedBase]: 1 };
        Object.entries(payload.rates || {}).forEach(([code, value]) => {
          const normalizedCode = normalizeCurrencyCode(code);
          if (!normalizedCode) return;
          if (CRYPTO_CODES.has(normalizedCode)) return;
          if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return;
          if (!isSupportedCurrencyCode(normalizedCode)) return;
          nextRates[normalizedCode] = value;
        });
        setBaseCurrency(fetchedBase);
        setRates(nextRates);
      } catch {
        if (!active) return;
        setBaseCurrency(DEFAULT_CURRENCY);
        setRates({ [DEFAULT_CURRENCY]: 1 });
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!rates[selectedCurrency]) {
      setSelectedCurrencyState(DEFAULT_CURRENCY);
    }
  }, [rates, selectedCurrency]);

  const setSelectedCurrency = useCallback((currency: string) => {
    const normalized = normalizeCurrencyCode(currency);
    if (!normalized) return;
    setSelectedCurrencyState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, normalized);
    }
  }, []);

  const convertPrice = useCallback(
    (amount: number, sourceCurrency?: string): number => {
      if (!Number.isFinite(amount)) return 0;
      const normalizedSource = normalizeCurrencyCode(sourceCurrency) || DEFAULT_CURRENCY;
      const sourceRate =
        normalizedSource === baseCurrency ? 1 : rates[normalizedSource] ?? rates[DEFAULT_CURRENCY] ?? 1;
      const targetRate =
        selectedCurrency === baseCurrency ? 1 : rates[selectedCurrency] ?? rates[DEFAULT_CURRENCY] ?? 1;
      const amountInBase = sourceRate > 0 ? amount / sourceRate : amount;
      return amountInBase * targetRate;
    },
    [baseCurrency, rates, selectedCurrency],
  );

  const formatWithSelectedCurrency = useCallback(
    (amount: number, sourceCurrency?: string) => {
      const converted = convertPrice(amount, sourceCurrency);
      return formatPrice(converted, selectedCurrency);
    },
    [convertPrice, selectedCurrency],
  );

  const formatSelectedCurrencyParts = useCallback(
    (amount: number, sourceCurrency?: string) => {
      const converted = convertPrice(amount, sourceCurrency);
      const amountText = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(converted);
      return {
        amount: amountText,
        currency: getCurrencyMarker(selectedCurrency),
      };
    },
    [convertPrice, selectedCurrency],
  );

  const currencies = useMemo<CurrencyOption[]>(
    () =>
      Object.keys(rates)
        .filter((code) => code !== 'USD' || rates.USD > 0)
        .sort((a, b) => a.localeCompare(b))
        .map((code) => ({
          code,
          symbol: getCurrencySymbol(code),
          rate: rates[code],
        })),
    [rates],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      selectedCurrency,
      setSelectedCurrency,
      currencies,
      isLoading,
      convertPrice,
      formatWithSelectedCurrency,
      formatSelectedCurrencyParts,
    }),
    [convertPrice, currencies, formatSelectedCurrencyParts, formatWithSelectedCurrency, isLoading, selectedCurrency, setSelectedCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

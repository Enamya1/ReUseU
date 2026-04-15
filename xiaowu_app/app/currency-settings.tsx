/**
 * Currency Settings Screen
 * Allow users to change display currency
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Divider } from '../src/components/ui/Divider';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
];

export default function CurrencySettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CNY');
  const [loading, setLoading] = useState(false);

  const handleCurrencySelect = async (code: string) => {
    if (code === selectedCurrency) return;

    try {
      setLoading(true);
      // TODO: Implement API call to update currency preference
      // await updateCurrency(code);
      setSelectedCurrency(code);
      
      // Show success feedback
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error updating currency:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Currency
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose your preferred currency for display
        </Text>
      </View>

      {/* Currency Options */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {CURRENCIES.map((currency, index) => (
          <React.Fragment key={currency.code}>
            <TouchableOpacity
              style={styles.currencyItem}
              onPress={() => handleCurrencySelect(currency.code)}
              disabled={loading}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.flag}>{currency.flag}</Text>
                <View style={styles.currencyText}>
                  <Text style={[styles.currencyName, { color: colors.text }]}>
                    {currency.name}
                  </Text>
                  <Text style={[styles.currencyCode, { color: colors.textSecondary }]}>
                    {currency.code} ({currency.symbol})
                  </Text>
                </View>
              </View>
              {selectedCurrency === currency.code && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>
            {index < CURRENCIES.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </View>

      {/* Info Note */}
      <View style={styles.infoContainer}>
        <Text style={[styles.infoText, { color: colors.textTertiary }]}>
          💡 Note: Prices will be converted for display only. Actual transactions use the seller's currency.
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: spacing.md,
    overflow: 'hidden',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  currencyText: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 14,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/**
 * Wallet Screen
 * User wallet and transactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Transaction } from '../src/types';
import { Button } from '../src/components/ui/Button';
import { Divider } from '../src/components/ui/Divider';

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    wallet_id: '1',
    type: 'top-up',
    amount: 100,
    fee: 0,
    status: 'completed',
    description: 'Wallet top-up',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    wallet_id: '1',
    type: 'transfer_out',
    amount: 45,
    fee: 0,
    status: 'completed',
    description: 'Purchase: Calculus Textbook',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function WalletScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [balance] = useState(155.00);
  const [transactions] = useState<Transaction[]>(mockTransactions);

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'top-up':
        return '⬆️';
      case 'transfer_out':
        return '⬇️';
      case 'transfer_in':
        return '📥';
      default:
        return '💰';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
    >
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceAmount}>¥{balance.toFixed(2)}</Text>
        <View style={styles.balanceActions}>
          <Button
            title="Top Up"
            variant="secondary"
            onPress={() => {}}
            style={styles.balanceButton}
          />
          <Button
            title="Withdraw"
            variant="outline"
            onPress={() => {}}
            style={[styles.balanceButton, { borderColor: '#FFF' }]}
          />
        </View>
      </View>

      {/* Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Transactions
        </Text>

        {transactions.map((transaction) => (
          <View key={transaction.id}>
            <TouchableOpacity style={styles.transactionItem}>
              <Text style={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </Text>
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionDesc, { color: colors.text }]}>
                  {transaction.description}
                </Text>
                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                  {formatDate(transaction.created_at)}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color: transaction.type === 'top-up' || transaction.type === 'transfer_in'
                      ? '#22C55E'
                      : colors.destructive,
                  },
                ]}
              >
                {transaction.type === 'top-up' || transaction.type === 'transfer_in' ? '+' : '-'}
                ¥{transaction.amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
            <Divider />
          </View>
        ))}

        {transactions.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No transactions yet
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceCard: {
    margin: spacing.screenPadding,
    padding: spacing.lg,
    borderRadius: spacing.md,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '700',
    marginVertical: spacing.md,
  },
  balanceActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  balanceButton: {
    marginHorizontal: spacing.sm,
    minWidth: 100,
  },
  transactionsSection: {
    padding: spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 16,
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Button } from '../src/components/ui/Button';
import { Divider } from '../src/components/ui/Divider';
import { getWallets, getTransactions, topUpWallet, withdrawFromWallet, createWallet, transferBetweenWallets, getWalletStatusHistory } from '../src/services/walletService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - (spacing.screenPadding * 2);

export default function WalletScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [wallets, setWallets] = useState<any[]>([]);
  const [currentWalletIndex, setCurrentWalletIndex] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      let walletsRes = await getWallets();
      
      // Create wallet if none exists
      if (walletsRes.length === 0) {
        await createWallet({ currency: 'CNY' });
        walletsRes = await getWallets();
      }
      
      setWallets(walletsRes);
      
      if (walletsRes.length > 0) {
        await loadTransactionsForWallet(walletsRes[0].id);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionsForWallet = async (walletId: number) => {
    try {
      setLoadingTransactions(true);
      const transactionsRes = await getTransactions(walletId, { limit: 50 });
      setTransactions(transactionsRes.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const onWalletScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    if (index !== currentWalletIndex && index >= 0 && index < wallets.length) {
      setCurrentWalletIndex(index);
      loadTransactionsForWallet(wallets[index].id);
    }
  };

  const handleTopUp = async () => {
    const currentWallet = wallets[currentWalletIndex];
    if (!currentWallet || !amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      Alert.alert('Error', 'Amount must be at least 0.01');
      return;
    }

    try {
      setProcessing(true);
      await topUpWallet(currentWallet.id, {
        amount: amountNum,
        reference: reference || undefined,
      });
      Alert.alert('Success', 'Wallet topped up successfully');
      setShowTopUpModal(false);
      setAmount('');
      setReference('');
      await loadWalletData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to top up wallet');
    } finally {
      setProcessing(false);
    }
  };

  const handleTransfer = async () => {
    const currentWallet = wallets[currentWalletIndex];
    if (!currentWallet || !amount || !toWalletId) {
      Alert.alert('Error', 'Please enter amount and recipient wallet ID');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      Alert.alert('Error', 'Amount must be at least 0.01');
      return;
    }

    try {
      setProcessing(true);
      await transferBetweenWallets({
        from_wallet_id: currentWallet.id,
        to_wallet_id: parseInt(toWalletId),
        amount: amountNum,
        reference: reference || undefined,
      });
      Alert.alert('Success', 'Transfer completed successfully');
      setShowTransferModal(false);
      setAmount('');
      setReference('');
      setToWalletId('');
      await loadWalletData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to transfer');
    } finally {
      setProcessing(false);
    }
  };

  const loadStatusHistory = async () => {
    const currentWallet = wallets[currentWalletIndex];
    if (!currentWallet) return;
    try {
      const history = await getWalletStatusHistory(currentWallet.id);
      setStatusHistory(history);
      setShowHistoryModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load history');
    }
  };

  const handleWithdraw = async () => {
    const currentWallet = wallets[currentWalletIndex];
    if (!currentWallet || !amount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      Alert.alert('Error', 'Amount must be at least 0.01');
      return;
    }

    try {
      setProcessing(true);
      await withdrawFromWallet(currentWallet.id, {
        amount: amountNum,
        reference: reference || undefined,
      });
      Alert.alert('Success', 'Withdrawal completed successfully');
      setShowWithdrawModal(false);
      setAmount('');
      setReference('');
      await loadWalletData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to withdraw from wallet');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (direction: string, type: string): string => {
    if (direction === 'credit') return '⬆️';
    if (direction === 'debit') return '⬇️';
    if (type?.includes('transfer')) return '💰';
    return '📥';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const renderWalletCard = ({ item }: { item: any }) => (
    <View style={[styles.balanceCard, { backgroundColor: colors.primary, width: CARD_WIDTH }]}>
      <Text style={styles.balanceLabel}>{item.name || 'Wallet'}</Text>
      {item.description && (
        <Text style={styles.walletDescription}>{item.description}</Text>
      )}
      <Text style={styles.balanceAmount}>{item.currency || 'CNY'} {parseFloat(item.balance || '0').toFixed(2)}</Text>
      <View style={styles.balanceActions}>
        <Button
          title="Top Up"
          variant="secondary"
          onPress={() => setShowTopUpModal(true)}
          style={styles.balanceButton}
        />
        <Button
          title="Withdraw"
          variant="outline"
          onPress={() => setShowWithdrawModal(true)}
          style={[styles.balanceButton, { borderColor: '#FFF' }]}
        />
      </View>
      <View style={[styles.balanceActions, { marginTop: spacing.sm }]}>
        <Button
          title="Transfer"
          variant="outline"
          onPress={() => setShowTransferModal(true)}
          style={[styles.balanceButton, { borderColor: '#FFF' }]}
        />
        <Button
          title="History"
          variant="outline"
          onPress={loadStatusHistory}
          style={[styles.balanceButton, { borderColor: '#FFF' }]}
        />
      </View>
    </View>
  );

  const renderSkeletonCard = () => (
    <View style={[styles.balanceCard, styles.skeletonCard, { backgroundColor: colors.surfaceSecondary, width: CARD_WIDTH }]}>
      <View style={[styles.skeletonText, styles.skeletonLabel, { backgroundColor: colors.border }]} />
      <View style={[styles.skeletonText, styles.skeletonAmount, { backgroundColor: colors.border }]} />
      <View style={styles.balanceActions}>
        <View style={[styles.skeletonButton, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonButton, { backgroundColor: colors.border }]} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Wallet Cards Slider */}
      <FlatList
        ref={flatListRef}
        data={wallets}
        renderItem={renderWalletCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={onWalletScroll}
        contentContainerStyle={styles.walletSlider}
        ListEmptyComponent={renderSkeletonCard}
      />
      
      {/* Wallet Indicator Dots */}
      {wallets.length > 1 && (
        <View style={styles.dotsContainer}>
          {wallets.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentWalletIndex ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
      >

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Transactions
          </Text>

          {loadingTransactions ? (
            <View>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i}>
                  <View style={styles.transactionItem}>
                    <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
                    <View style={styles.transactionInfo}>
                      <View style={[styles.skeletonText, styles.skeletonTransactionDesc, { backgroundColor: colors.border }]} />
                      <View style={[styles.skeletonText, styles.skeletonTransactionDate, { backgroundColor: colors.border }]} />
                    </View>
                    <View style={[styles.skeletonText, styles.skeletonTransactionAmount, { backgroundColor: colors.border }]} />
                  </View>
                  <Divider />
                </View>
              ))}
            </View>
          ) : (
            <>
              {transactions.map((transaction) => (
                <View key={transaction.id || transaction.ledger_uuid}>
                  <TouchableOpacity style={styles.transactionItem}>
                    <Text style={styles.transactionIcon}>
                      {getTransactionIcon(transaction.direction, transaction.type)}
                    </Text>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionDesc, { color: colors.text }]}>
                        {transaction.reference || transaction.type || 'Transaction'}
                      </Text>
                      <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                        {formatDate(transaction.occurred_at || transaction.created_at)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color: transaction.direction === 'credit'
                            ? '#22C55E'
                            : colors.destructive,
                        },
                      ]}
                    >
                      {transaction.direction === 'credit' ? '+' : '-'}
                      {transaction.currency || wallets[currentWalletIndex]?.currency || 'CNY'} {parseFloat(transaction.amount).toFixed(2)}
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
            </>
          )}
        </View>
      </ScrollView>

      {/* Top Up Modal */}
      <Modal visible={showTopUpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Top Up Wallet</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Amount"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Reference (optional)"
              placeholderTextColor={colors.textTertiary}
              value={reference}
              onChangeText={setReference}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => {
                  setShowTopUpModal(false);
                  setAmount('');
                  setReference('');
                }}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleTopUp}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Top Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Withdraw</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Amount"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Reference (optional)"
              placeholderTextColor={colors.textTertiary}
              value={reference}
              onChangeText={setReference}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => {
                  setShowWithdrawModal(false);
                  setAmount('');
                  setReference('');
                }}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleWithdraw}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Transfer</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Recipient Wallet ID"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              value={toWalletId}
              onChangeText={setToWalletId}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Amount"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Reference (optional)"
              placeholderTextColor={colors.textTertiary}
              value={reference}
              onChangeText={setReference}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => {
                  setShowTransferModal(false);
                  setAmount('');
                  setReference('');
                  setToWalletId('');
                }}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleTransfer}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Transfer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Wallet Status History</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {statusHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={[styles.historyText, { color: colors.text }]}>
                    {item.old_status} → {item.new_status}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                  {item.reason && (
                    <Text style={[styles.historyReason, { color: colors.textTertiary }]}>
                      {item.reason}
                    </Text>
                  )}
                </View>
              ))}
              {statusHistory.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No status changes
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary, marginTop: spacing.md }]}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.modalButtonPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  walletSlider: {
    paddingHorizontal: spacing.screenPadding,
  },
  balanceCard: {
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: spacing.md,
    alignItems: 'center',
  },
  walletDescription: {
    color: '#FFF',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  scrollContent: {
    flex: 1,
  },
  skeletonCard: {
    justifyContent: 'center',
  },
  skeletonText: {
    borderRadius: 4,
  },
  skeletonLabel: {
    width: 80,
    height: 14,
    marginBottom: spacing.sm,
  },
  skeletonAmount: {
    width: 150,
    height: 36,
    marginVertical: spacing.md,
  },
  skeletonButton: {
    width: 100,
    height: 40,
    borderRadius: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.md,
  },
  skeletonTransactionDesc: {
    width: 120,
    height: 16,
    marginBottom: 4,
  },
  skeletonTransactionDate: {
    width: 80,
    height: 12,
  },
  skeletonTransactionAmount: {
    width: 70,
    height: 16,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: spacing.lg,
    borderRadius: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  modalInput: {
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonPrimaryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  historyItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  historyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 4,
  },
  historyReason: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

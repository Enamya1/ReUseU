import { describe, it, expect } from 'vitest';

// Simulation of the wallet logic for testing purposes
interface Wallet {
  id: string;
  balance: number;
  status: 'active' | 'frozen';
}

const validateTransfer = (sender: Wallet, amount: number, recipientId: string) => {
  if (sender.status !== 'active') return { success: false, error: 'Wallet is frozen' };
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };
  if (sender.balance < amount) return { success: false, error: 'Insufficient funds' };
  if (!recipientId) return { success: false, error: 'Recipient wallet ID is required' };
  if (sender.id === recipientId) return { success: false, error: 'Cannot transfer to the same wallet' };
  return { success: true };
};

const validateWithdrawal = (wallet: Wallet, amount: number) => {
  const fee = 1.00;
  if (wallet.status !== 'active') return { success: false, error: 'Wallet is frozen' };
  if (amount <= 0) return { success: false, error: 'Amount must be greater than zero' };
  if (wallet.balance < (amount + fee)) return { success: false, error: 'Insufficient funds (including fee)' };
  return { success: true };
};

describe('Wallet Logic Tests', () => {
  const activeWallet: Wallet = { id: 'W-1', balance: 1000, status: 'active' };
  const frozenWallet: Wallet = { id: 'W-2', balance: 1000, status: 'frozen' };

  describe('Transfer Validation', () => {
    it('should allow valid transfer', () => {
      const result = validateTransfer(activeWallet, 500, 'W-3');
      expect(result.success).toBe(true);
    });

    it('should fail if wallet is frozen', () => {
      const result = validateTransfer(frozenWallet, 100, 'W-3');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet is frozen');
    });

    it('should fail if amount is negative or zero', () => {
      const result1 = validateTransfer(activeWallet, 0, 'W-3');
      const result2 = validateTransfer(activeWallet, -10, 'W-3');
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('should fail if balance is insufficient', () => {
      const result = validateTransfer(activeWallet, 2000, 'W-3');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });

    it('should fail if recipient is missing', () => {
      const result = validateTransfer(activeWallet, 100, '');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Recipient wallet ID is required');
    });

    it('should fail if transferring to same wallet', () => {
      const result = validateTransfer(activeWallet, 100, 'W-1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot transfer to the same wallet');
    });
  });

  describe('Withdrawal Validation', () => {
    it('should allow valid withdrawal', () => {
      const result = validateWithdrawal(activeWallet, 500);
      expect(result.success).toBe(true);
    });

    it('should fail if balance is insufficient for amount + fee', () => {
      const lowBalanceWallet: Wallet = { id: 'W-3', balance: 100, status: 'active' };
      const result = validateWithdrawal(lowBalanceWallet, 100); // 100 + 1 fee > 100 balance
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds (including fee)');
    });
  });
});

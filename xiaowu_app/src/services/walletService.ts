/**
 * Wallet Service
 * Handles all wallet-related API calls
 */

import { apiClient, handleApiError } from './api';
import type { Wallet, Transaction, WalletStatusHistory } from '../types';

/**
 * Create a new wallet
 */
export const createWallet = async (data?: {
  wallet_type_id?: number;
  name?: string;
  description?: string;
  currency?: string;
  initial_balance?: number;
}): Promise<Wallet> => {
  try {
    const response = await apiClient.post('/api/wallets', data || {});
    return response.data.wallet;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all user wallets
 */
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const response = await apiClient.get('/api/wallets');
    return response.data.wallets || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get wallet by ID
 */
export const getWallet = async (walletId: number): Promise<Wallet> => {
  try {
    const response = await apiClient.get(`/api/wallets/${walletId}`);
    return response.data.wallet;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get wallet transactions
 */
export const getTransactions = async (walletId: number, params?: {
  status?: string;
  direction?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{ transactions: Transaction[]; total?: number }> => {
  try {
    const response = await apiClient.get(`/api/wallets/${walletId}/transactions`, { params });
    return {
      transactions: response.data.transactions || [],
      total: response.data.total,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Top up wallet
 */
export const topUpWallet = async (walletId: number, data: {
  amount: number;
  type?: string;
  reference?: string;
  metadata?: any;
}): Promise<{ wallet: Wallet; ledger_id: string }> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/top-up`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Withdraw from wallet
 */
export const withdrawFromWallet = async (walletId: number, data: {
  amount: number;
  type?: string;
  reference?: string;
  metadata?: any;
}): Promise<{ wallet: Wallet; ledger_id: string }> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/withdraw`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Transfer between wallets
 */
export const transferBetweenWallets = async (data: {
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  reference?: string;
  metadata?: any;
}): Promise<{ atomic_transaction_id: string; debit_ledger_id: string; credit_ledger_id: string }> => {
  try {
    const response = await apiClient.post('/api/wallets/transfer', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get wallet status history
 */
export const getWalletStatusHistory = async (walletId: number): Promise<WalletStatusHistory[]> => {
  try {
    const response = await apiClient.get(`/api/wallets/${walletId}/status-history`);
    return response.data.history || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Request wallet freeze/unfreeze
 */
export const requestWalletStatusChange = async (walletId: number, data: {
  action: 'freeze' | 'unfreeze';
  reason?: string;
}): Promise<{ request_id: number }> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/status-requests`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Close wallet
 */
export const closeWallet = async (walletId: number, reason?: string): Promise<Wallet> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/close`, { reason });
    return response.data.wallet;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Open wallet
 */
export const openWallet = async (walletId: number, reason?: string): Promise<Wallet> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/open`, { reason });
    return response.data.wallet;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create atomic transaction
 */
export const createAtomicTransaction = async (data: {
  steps: Array<{
    step_type: string;
    from_wallet_id?: number;
    to_wallet_id?: number;
    amount: number;
    currency: string;
  }>;
  metadata?: any;
}): Promise<any> => {
  try {
    const response = await apiClient.post('/api/atomic-transactions', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get atomic transaction
 */
export const getAtomicTransaction = async (atomicId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/atomic-transactions/${atomicId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Verify atomic transaction
 */
export const verifyAtomicTransaction = async (atomicId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/api/atomic-transactions/${atomicId}/verify`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

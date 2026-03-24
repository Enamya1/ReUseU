/**
 * Wallet Service
 * Handles all wallet-related API calls
 */

import { apiClient, handleApiError } from './api';
import type { Wallet, Transaction } from '../types';

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
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get wallet transactions
 */
export const getTransactions = async (walletId: number, params?: {
  page?: number;
  page_size?: number;
  type?: string;
}): Promise<{ transactions: Transaction[]; total: number }> => {
  try {
    const response = await apiClient.get(`/api/wallets/${walletId}/transactions`, { params });
    return {
      transactions: response.data.transactions || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Top up wallet
 */
export const topUpWallet = async (walletId: number, amount: number): Promise<{ 
  transaction: Transaction;
  payment_url?: string;
}> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/top-up`, { amount });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Withdraw from wallet
 */
export const withdrawFromWallet = async (walletId: number, amount: number): Promise<Transaction> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/withdraw`, { amount });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Transfer to another user
 */
export const transferToUser = async (walletId: number, params: {
  receiver_id: number;
  amount: number;
  description?: string;
}): Promise<Transaction> => {
  try {
    const response = await apiClient.post(`/api/wallets/${walletId}/transfer`, params);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get wallet balance
 */
export const getWalletBalance = async (walletId: number): Promise<{ balance: number; currency: string }> => {
  try {
    const response = await apiClient.get(`/api/wallets/${walletId}/balance`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Storage Utility
 * Provides a unified interface for storing data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const setSecureItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    await AsyncStorage.setItem(key, value);
  }
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    return await AsyncStorage.getItem(key);
  }
};

export const deleteSecureItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    await AsyncStorage.removeItem(key);
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  await AsyncStorage.setItem(key, value);
};

export const getItem = async (key: string): Promise<string | null> => {
  return await AsyncStorage.getItem(key);
};

export const removeItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};

/**
 * Share Utility
 * Handle product sharing functionality
 */

import { Share, Platform } from 'react-native';
import type { Product } from '../types';

export interface ShareProductOptions {
  product: Product;
  baseUrl?: string;
}

/**
 * Share a product using native share dialog
 */
export async function shareProduct(options: ShareProductOptions): Promise<void> {
  const { product, baseUrl } = options;

  // Build the share content
  const title = product.title || 'Check out this item!';
  const description = product.description
    ? `${product.title}\n\n${product.description}\n\nPrice: ${product.price} ${product.currency || 'CNY'}`
    : `${product.title}\n\nPrice: ${product.price} ${product.currency || 'CNY'}`;

  // Build the URL if baseUrl is provided
  const url = baseUrl ? `${baseUrl}/product/${product.id}` : undefined;

  try {
    const result = await Share.share({
      message: url ? `${description}\n\n${url}` : description,
      title: title,
      url: url, // iOS only
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // Shared via specific activity (iOS)
        console.log('Shared via:', result.activityType);
      } else {
        // Shared successfully
        console.log('Product shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing product:', error);
    throw error;
  }
}

/**
 * Copy product link to clipboard
 */
export async function copyProductLink(productId: number, baseUrl?: string): Promise<void> {
  const url = baseUrl ? `${baseUrl}/product/${productId}` : `Product #${productId}`;

  try {
    // React Native's Share can be used for copying, or you can use expo-clipboard
    await Share.share({
      message: url,
      title: 'Copy link',
    });
  } catch (error) {
    console.error('Error copying product link:', error);
    throw error;
  }
}

/**
 * Share product with custom message
 */
export async function shareProductWithMessage(
  product: Product,
  customMessage?: string,
  baseUrl?: string
): Promise<void> {
  const message = customMessage
    ? `${customMessage}\n\n${product.title} - ${product.price} ${product.currency || 'CNY'}`
    : `Check out this listing: ${product.title} - ${product.price} ${product.currency || 'CNY'}`;

  const url = baseUrl ? `${baseUrl}/product/${product.id}` : undefined;

  try {
    await Share.share({
      message: url ? `${message}\n\n${url}` : message,
      title: product.title,
      url: url,
    });
  } catch (error) {
    console.error('Error sharing product with message:', error);
    throw error;
  }
}

/**
 * Share seller profile
 */
export async function shareSellerProfile(
  sellerId: number,
  sellerName?: string,
  baseUrl?: string
): Promise<void> {
  const url = baseUrl ? `${baseUrl}/seller/${sellerId}` : undefined;
  const message = sellerName
    ? `Check out ${sellerName}'s profile on Suki!`
    : 'Check out this seller profile on Suki!';

  try {
    await Share.share({
      message: url ? `${message}\n\n${url}` : message,
      title: 'Share Seller Profile',
      url: url,
    });
  } catch (error) {
    console.error('Error sharing seller profile:', error);
    throw error;
  }
}

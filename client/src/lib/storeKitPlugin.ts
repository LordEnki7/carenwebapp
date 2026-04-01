import { registerPlugin } from '@capacitor/core';

export interface StoreKitProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export interface StoreKitTransaction {
  transactionId: string;
  productId: string;
  originalTransactionId: string;
  purchaseDate: string;
  expiresDate: string;
  jwsRepresentation?: string;
}

export interface StoreKitPlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: StoreKitProduct[] }>;
  purchaseProduct(options: { productId: string }): Promise<{ transaction: StoreKitTransaction }>;
  restorePurchases(): Promise<{ transactions: StoreKitTransaction[] }>;
  getCurrentTransactions(): Promise<{ transactions: StoreKitTransaction[] }>;
  finishTransaction(options: { transactionId: string }): Promise<void>;
}

export const StoreKit = registerPlugin<StoreKitPlugin>('StoreKit');

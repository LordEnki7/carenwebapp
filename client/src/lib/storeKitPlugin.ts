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
  originalTransactionId?: string;
  purchaseDate: string;
  expiresDate?: string;
  jwsRepresentation?: string;
}

export const StoreKit = {
  getProducts: async (_: any) => ({ products: [] as StoreKitProduct[] }),
  purchaseProduct: async (_: any) => ({ transaction: {} as StoreKitTransaction }),
  finishTransaction: async (_: any) => {},
  restorePurchases: async () => ({ transactions: [] as StoreKitTransaction[] }),
  getCurrentTransactions: async () => ({ transactions: [] as StoreKitTransaction[] }),
};

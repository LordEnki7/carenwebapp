export type PlanId = string;

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmount: number;
  currency: string;
}

export interface IAPTransaction {
  transactionId: string;
  productId: string;
  originalTransactionId?: string;
  purchaseDate: string;
  expiresDate?: string;
  jwsRepresentation?: string;
}

class InAppPurchaseService {
  isAvailable(): boolean { return false; }
  getWebProducts(): IAPProduct[] { return []; }
  async getProducts(): Promise<IAPProduct[]> { return []; }
  async purchase(): Promise<IAPTransaction | null> { return null; }
  async validateReceipt(): Promise<boolean> { return false; }
  async restorePurchases(): Promise<IAPTransaction[]> { return []; }
  async getCurrentSubscription(): Promise<IAPTransaction | null> { return null; }
}

export const iapService = new InAppPurchaseService();
export default iapService;

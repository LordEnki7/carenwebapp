import { Capacitor } from '@capacitor/core';

const PRODUCT_IDS = {
  basic_guard: 'com.caren.safetyapp.basic_guard',
  safety_pro: 'com.caren.safetyapp.safety_pro_monthly',
  constitutional_pro: 'com.caren.safetyapp.constitutional_pro_monthly',
  family_protection: 'com.caren.safetyapp.family_protection_monthly',
  enterprise_fleet: 'com.caren.safetyapp.enterprise_fleet_monthly',
} as const;

export type PlanId = keyof typeof PRODUCT_IDS;

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
  private isNative: boolean;
  private initialized = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  isAvailable(): boolean {
    return this.isNative;
  }

  getProductId(planId: PlanId): string {
    return PRODUCT_IDS[planId];
  }

  getPlanIdFromProductId(productId: string): PlanId | null {
    const entry = Object.entries(PRODUCT_IDS).find(([_, id]) => id === productId);
    return entry ? (entry[0] as PlanId) : null;
  }

  async initialize(): Promise<void> {
    if (!this.isNative || this.initialized) return;

    try {
      const { registerPlugin } = await import('@capacitor/core');
      const StoreKit = registerPlugin('StoreKit');
      (this as any)._storekit = StoreKit;
      this.initialized = true;
    } catch (e) {
      console.log('StoreKit not available, using web fallback');
    }
  }

  async getProducts(planIds?: PlanId[]): Promise<IAPProduct[]> {
    if (!this.isNative) {
      return this.getWebProducts(planIds);
    }

    try {
      await this.initialize();
      const ids = planIds
        ? planIds.map(id => PRODUCT_IDS[id])
        : Object.values(PRODUCT_IDS);

      const storekit = (this as any)._storekit;
      if (storekit) {
        const result = await storekit.getProducts({ productIds: ids });
        return result.products || [];
      }
    } catch (e) {
      console.error('Failed to fetch products from StoreKit:', e);
    }

    return this.getWebProducts(planIds);
  }

  private getWebProducts(planIds?: PlanId[]): IAPProduct[] {
    const allProducts: Record<PlanId, IAPProduct> = {
      basic_guard: {
        productId: PRODUCT_IDS.basic_guard,
        title: 'Basic Guard',
        description: 'Essential legal rights lookup for your state.',
        price: '$0.99',
        priceAmount: 0.99,
        currency: 'USD',
      },
      safety_pro: {
        productId: PRODUCT_IDS.safety_pro,
        title: 'Safety Pro',
        description: 'GPS-enabled legal rights, voice commands, and incident recording.',
        price: '$4.99/mo',
        priceAmount: 4.99,
        currency: 'USD',
      },
      constitutional_pro: {
        productId: PRODUCT_IDS.constitutional_pro,
        title: 'Constitutional Pro',
        description: 'Full AI-powered protection suite with attorney connect.',
        price: '$9.99/mo',
        priceAmount: 9.99,
        currency: 'USD',
      },
      family_protection: {
        productId: PRODUCT_IDS.family_protection,
        title: 'Family Protection',
        description: 'Protect your entire family with up to 6 linked accounts.',
        price: '$24.99/mo',
        priceAmount: 24.99,
        currency: 'USD',
      },
      enterprise_fleet: {
        productId: PRODUCT_IDS.enterprise_fleet,
        title: 'Enterprise Fleet',
        description: 'Fleet-wide legal protection for businesses.',
        price: '$49.99/mo',
        priceAmount: 49.99,
        currency: 'USD',
      },
    };

    if (planIds) {
      return planIds.map(id => allProducts[id]);
    }
    return Object.values(allProducts);
  }

  async purchase(planId: PlanId): Promise<IAPTransaction | null> {
    const productId = PRODUCT_IDS[planId];

    if (!this.isNative) {
      return this.purchaseViaStripe(planId);
    }

    try {
      await this.initialize();
      const storekit = (this as any)._storekit;

      if (storekit) {
        const result = await storekit.purchaseProduct({ productId });

        if (result.transaction) {
          const transaction: IAPTransaction = {
            transactionId: result.transaction.transactionId,
            productId: result.transaction.productId,
            originalTransactionId: result.transaction.originalTransactionId,
            purchaseDate: result.transaction.purchaseDate,
            expiresDate: result.transaction.expiresDate,
            jwsRepresentation: result.transaction.jwsRepresentation,
          };

          await this.validateReceipt(transaction);
          await storekit.finishTransaction({ transactionId: transaction.transactionId });

          return transaction;
        }
      }
    } catch (e: any) {
      if (e?.code === 'USER_CANCELLED') {
        return null;
      }
      console.error('Purchase failed:', e);
      throw new Error(e?.message || 'Purchase failed. Please try again.');
    }

    return null;
  }

  private async purchaseViaStripe(planId: PlanId): Promise<null> {
    window.location.href = `/payment?plan=${planId}`;
    return null;
  }

  async validateReceipt(transaction: IAPTransaction): Promise<boolean> {
    try {
      const response = await fetch('/api/iap/validate-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          productId: transaction.productId,
          originalTransactionId: transaction.originalTransactionId,
          purchaseDate: transaction.purchaseDate,
          expiresDate: transaction.expiresDate,
          jwsRepresentation: transaction.jwsRepresentation,
          platform: 'ios',
        }),
      });

      const data = await response.json();
      return data.valid === true;
    } catch (e) {
      console.error('Receipt validation failed:', e);
      return false;
    }
  }

  async restorePurchases(): Promise<IAPTransaction[]> {
    if (!this.isNative) return [];

    try {
      await this.initialize();
      const storekit = (this as any)._storekit;

      if (storekit) {
        const result = await storekit.restorePurchases();
        const transactions: IAPTransaction[] = (result.transactions || []).map((t: any) => ({
          transactionId: t.transactionId,
          productId: t.productId,
          originalTransactionId: t.originalTransactionId,
          purchaseDate: t.purchaseDate,
          expiresDate: t.expiresDate,
          jwsRepresentation: t.jwsRepresentation,
        }));

        for (const tx of transactions) {
          await this.validateReceipt(tx);
        }

        return transactions;
      }
    } catch (e) {
      console.error('Restore purchases failed:', e);
    }

    return [];
  }

  async getCurrentSubscription(): Promise<IAPTransaction | null> {
    if (!this.isNative) return null;

    try {
      await this.initialize();
      const storekit = (this as any)._storekit;

      if (storekit) {
        const result = await storekit.getCurrentTransactions();
        const active = (result.transactions || []).find((t: any) => {
          if (!t.expiresDate) return true;
          return new Date(t.expiresDate) > new Date();
        });
        return active || null;
      }
    } catch (e) {
      console.error('Get current subscription failed:', e);
    }

    return null;
  }
}

export const iapService = new InAppPurchaseService();
export default iapService;

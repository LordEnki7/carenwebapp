import { Capacitor } from '@capacitor/core';
import { StoreKit } from './storeKitPlugin';

export const PRODUCT_IDS = {
  community_guardian: 'com.caren.safetyapp.community_guardian',
  standard_plan: 'com.caren.safetyapp.standard_plan_monthly',
  legal_shield: 'com.caren.safetyapp.legal_shield_monthly',
  family_plan: 'com.caren.safetyapp.family_plan_monthly',
  fleet_enterprise: 'com.caren.safetyapp.fleet_enterprise_monthly',
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

const WEB_PRODUCTS: Record<PlanId, IAPProduct> = {
  community_guardian: {
    productId: PRODUCT_IDS.community_guardian,
    title: 'Community Guardian',
    description: 'One-time Early Access pass — essential legal rights lookup.',
    price: '$0.99',
    priceAmount: 0.99,
    currency: 'USD',
  },
  standard_plan: {
    productId: PRODUCT_IDS.standard_plan,
    title: 'Standard Plan',
    description: 'GPS-enabled legal rights, voice commands, and incident recording.',
    price: '$4.99/mo',
    priceAmount: 4.99,
    currency: 'USD',
  },
  legal_shield: {
    productId: PRODUCT_IDS.legal_shield,
    title: 'Legal Shield',
    description: 'Full AI-powered protection suite with attorney connect.',
    price: '$9.99/mo',
    priceAmount: 9.99,
    currency: 'USD',
  },
  family_plan: {
    productId: PRODUCT_IDS.family_plan,
    title: 'Family Plan',
    description: 'Protect your entire family with up to 6 linked accounts.',
    price: '$29.99/mo',
    priceAmount: 29.99,
    currency: 'USD',
  },
  fleet_enterprise: {
    productId: PRODUCT_IDS.fleet_enterprise,
    title: 'Fleet & Enterprise',
    description: 'Fleet-wide legal protection for businesses.',
    price: '$49.99/mo',
    priceAmount: 49.99,
    currency: 'USD',
  },
};

class InAppPurchaseService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
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

  getWebProducts(planIds?: PlanId[]): IAPProduct[] {
    if (planIds) {
      return planIds.map(id => WEB_PRODUCTS[id]).filter(Boolean);
    }
    return Object.values(WEB_PRODUCTS);
  }

  async getProducts(planIds?: PlanId[]): Promise<IAPProduct[]> {
    if (!this.isNative) return this.getWebProducts(planIds);
    try {
      const ids = planIds
        ? planIds.map(id => PRODUCT_IDS[id])
        : Object.values(PRODUCT_IDS);
      const { products } = await StoreKit.getProducts({ productIds: ids });
      if (products.length === 0) return this.getWebProducts(planIds);
      return products.map(p => ({
        productId: p.productId,
        title: p.title,
        description: p.description,
        price: p.price,
        priceAmount: p.priceAmount,
        currency: p.currency,
      }));
    } catch {
      return this.getWebProducts(planIds);
    }
  }

  async purchase(planId: PlanId): Promise<IAPTransaction | null> {
    if (!this.isNative) {
      window.location.href = `/payment?plan=${planId}`;
      return null;
    }

    const productId = PRODUCT_IDS[planId];
    const { transaction } = await StoreKit.purchaseProduct({ productId });

    const iap: IAPTransaction = {
      transactionId: transaction.transactionId,
      productId: transaction.productId,
      originalTransactionId: transaction.originalTransactionId,
      purchaseDate: transaction.purchaseDate,
      expiresDate: transaction.expiresDate,
      jwsRepresentation: transaction.jwsRepresentation,
    };

    // Finish the transaction so it leaves the payment queue
    try { await StoreKit.finishTransaction({ transactionId: transaction.transactionId }); } catch (_) {}

    // Best-effort server-side receipt validation
    try { await this.validateReceipt(iap); } catch (_) {}

    return iap;
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
      const { transactions } = await StoreKit.restorePurchases();
      return transactions.map(t => ({
        transactionId: t.transactionId,
        productId: t.productId,
        originalTransactionId: t.originalTransactionId,
        purchaseDate: t.purchaseDate,
        expiresDate: t.expiresDate,
        jwsRepresentation: t.jwsRepresentation,
      }));
    } catch { return []; }
  }

  async getCurrentSubscription(): Promise<IAPTransaction | null> {
    if (!this.isNative) return null;
    try {
      const { transactions } = await StoreKit.getCurrentTransactions();
      if (!transactions.length) return null;
      const t = transactions[0];
      return {
        transactionId: t.transactionId,
        productId: t.productId,
        originalTransactionId: t.originalTransactionId,
        purchaseDate: t.purchaseDate,
        expiresDate: t.expiresDate,
        jwsRepresentation: t.jwsRepresentation,
      };
    } catch { return null; }
  }
}

export const iapService = new InAppPurchaseService();
export default iapService;

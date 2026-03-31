import { Capacitor } from '@capacitor/core';

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
    return this.getWebProducts(planIds);
  }

  async purchase(planId: PlanId): Promise<IAPTransaction | null> {
    if (!this.isNative) {
      window.location.href = `/payment?plan=${planId}`;
      return null;
    }

    // Native iOS path — requires StoreKit products to be configured in App Store Connect.
    // Products must be submitted and approved in App Store Connect before this will work in sandbox.
    throw new Error(
      'In-App Purchase is not yet available. Please contact support@carenalert.com to complete your upgrade.'
    );
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
    return [];
  }

  async getCurrentSubscription(): Promise<IAPTransaction | null> {
    return null;
  }
}

export const iapService = new InAppPurchaseService();
export default iapService;

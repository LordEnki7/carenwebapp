import { Capacitor } from "@capacitor/core";

export type PlanId =
  | "community_guardian"
  | "standard_plan"
  | "legal_shield"
  | "family_plan"
  | "fleet_enterprise";

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
}

// Map plan IDs to App Store product identifiers
// NOTE: _v2 IDs used because original IDs were deleted in App Store Connect.
// If Apple restores the originals, remove _v2 from all IDs here and in Plans.tsx + Products.storekit
export const PRODUCT_IDS: Record<PlanId, string> = {
  community_guardian:  "com.caren.safetyapp.community_guardian_v2",
  standard_plan:       "com.caren.safetyapp.standard_plan_monthly_v2",
  legal_shield:        "com.caren.safetyapp.legal_shield_monthly_v2",
  family_plan:         "com.caren.safetyapp.family_plan_monthly_v2",
  fleet_enterprise:    "com.caren.safetyapp.fleet_enterprise_monthly_v2",
};

// RevenueCat iOS public API key — set this once you have it from app.revenuecat.com
// It looks like: appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const RC_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;

const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

class InAppPurchaseService {
  private rcModule: any = null;
  private initialized = false;

  isAvailable(): boolean {
    return isIOS && !!RC_IOS_API_KEY;
  }

  async initialize(): Promise<void> {
    if (!this.isAvailable() || this.initialized) return;
    try {
      // Native-only import — hidden from Vite's static scanner via Function wrapper
      // This ONLY executes on native iOS where RevenueCat is bundled by Capacitor
      // eslint-disable-next-line no-new-func
      const { Purchases, LOG_LEVEL } = await new Function('m', 'return import(m)')("@revenuecat/purchases-capacitor");
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: RC_IOS_API_KEY! });
      this.rcModule = Purchases;
      this.initialized = true;
      console.log("[IAP] RevenueCat initialized");
    } catch (err) {
      console.error("[IAP] RevenueCat initialization failed:", err);
    }
  }

  async getOfferings(): Promise<any> {
    if (!this.rcModule) await this.initialize();
    if (!this.rcModule) return null;
    const { current } = await this.rcModule.getOfferings();
    return current;
  }

  async purchase(planId: PlanId): Promise<{ success: boolean; error?: string }> {
    if (!this.rcModule) await this.initialize();
    if (!this.rcModule) {
      return { success: false, error: "Purchases not available on this device" };
    }

    try {
      const offerings = await this.getOfferings();
      if (!offerings) return { success: false, error: "Could not load products" };

      const productId = PRODUCT_IDS[planId];
      const pkg = offerings.availablePackages?.find(
        (p: any) => p.product?.identifier === productId
      );

      if (!pkg) return { success: false, error: "Product not found" };

      await this.rcModule.purchasePackage({ aPackage: pkg });
      return { success: true };
    } catch (err: any) {
      if (err?.code === "1" || err?.userCancelled) {
        return { success: false, error: "cancelled" };
      }
      return { success: false, error: err?.message || "Purchase failed" };
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.rcModule) await this.initialize();
    if (!this.rcModule) return false;
    try {
      const { customerInfo } = await this.rcModule.getCustomerInfo();
      const entitlements = customerInfo?.entitlements?.active ?? {};
      return Object.keys(entitlements).length > 0;
    } catch {
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.rcModule) await this.initialize();
    if (!this.rcModule) return false;
    try {
      const { customerInfo } = await this.rcModule.restorePurchases();
      const entitlements = customerInfo?.entitlements?.active ?? {};
      return Object.keys(entitlements).length > 0;
    } catch {
      return false;
    }
  }
}

export const iapService = new InAppPurchaseService();
export default iapService;

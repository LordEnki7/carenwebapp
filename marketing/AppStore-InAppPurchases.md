# C.A.R.E.N.™ In-App Purchases — App Store Connect Setup

## Subscription Group Name
**CAREN Legal Protection**

Group ID: `com.caren.safetyapp.subscriptions`

---

## Products

### 1. Basic Guard (Non-Consumable)
| Field | Value |
|-------|-------|
| **Type** | Non-Consumable |
| **Reference Name** | Basic Guard |
| **Product ID** | `com.caren.safetyapp.basic_guard` |
| **Price** | $0.99 (Tier 1) |
| **Display Name** | Basic Guard |
| **Description** | Essential legal rights lookup for your state. Know your rights at any traffic stop with our comprehensive 50-state legal database. |

---

### 2. Safety Pro (Auto-Renewable Subscription)
| Field | Value |
|-------|-------|
| **Type** | Auto-Renewable Subscription |
| **Reference Name** | Safety Pro Monthly |
| **Product ID** | `com.caren.safetyapp.safety_pro_monthly` |
| **Price** | $4.99/month |
| **Subscription Group** | CAREN Legal Protection |
| **Subscription Duration** | 1 Month |
| **Display Name** | Safety Pro |
| **Description** | GPS-enabled legal rights, voice commands, incident recording, and emergency contact alerts. Hands-free protection for every drive. |

---

### 3. Constitutional Pro (Auto-Renewable Subscription)
| Field | Value |
|-------|-------|
| **Type** | Auto-Renewable Subscription |
| **Reference Name** | Constitutional Pro Monthly |
| **Product ID** | `com.caren.safetyapp.constitutional_pro_monthly` |
| **Price** | $9.99/month |
| **Subscription Group** | CAREN Legal Protection |
| **Subscription Duration** | 1 Month |
| **Level of Service** | Level 1 (Highest) |
| **Display Name** | Constitutional Pro |
| **Description** | Full AI-powered protection suite: real-time voice coaching, attorney connect, AI legal assistant, recording analysis, legal document generator, and emergency SOS with family notification. |

---

### 4. Family Protection (Auto-Renewable Subscription)
| Field | Value |
|-------|-------|
| **Type** | Auto-Renewable Subscription |
| **Reference Name** | Family Protection Monthly |
| **Product ID** | `com.caren.safetyapp.family_protection_monthly` |
| **Price** | $24.99/month |
| **Subscription Group** | CAREN Legal Protection |
| **Subscription Duration** | 1 Month |
| **Level of Service** | Level 1 (Highest) |
| **Display Name** | Family Protection |
| **Description** | Protect your entire family with up to 6 linked accounts. Includes all Constitutional Pro features plus coordinated family emergency alerts, shared attorney access, and multi-device Bluetooth sync. |

---

### 5. Enterprise Fleet (Auto-Renewable Subscription)
| Field | Value |
|-------|-------|
| **Type** | Auto-Renewable Subscription |
| **Reference Name** | Enterprise Fleet Monthly |
| **Product ID** | `com.caren.safetyapp.enterprise_fleet_monthly` |
| **Price** | $49.99/month |
| **Subscription Group** | CAREN Legal Protection |
| **Subscription Duration** | 1 Month |
| **Level of Service** | Level 1 (Highest) |
| **Display Name** | Enterprise Fleet |
| **Description** | Fleet-wide legal protection for businesses with commercial drivers. Includes admin dashboard, fleet-wide emergency monitoring, bulk driver management, compliance reporting, and priority attorney access for all drivers. |

---

## Subscription Group Ranking (Top to Bottom)
1. Enterprise Fleet ($49.99) — Level 1
2. Family Protection ($24.99) — Level 2
3. Constitutional Pro ($9.99) — Level 3
4. Safety Pro ($4.99) — Level 4

Higher-ranked plans include all features of lower-ranked plans. Users upgrading move immediately; users downgrading take effect at next renewal.

---

## App Store Connect Setup Steps

### Step 1: Create Subscription Group
1. Go to **App Store Connect > Your App > Subscriptions**
2. Click **+** to create a new Subscription Group
3. Name it: `CAREN Legal Protection`

### Step 2: Add Subscriptions to Group
For each subscription (Safety Pro, Constitutional Pro, Family Protection, Enterprise Fleet):
1. Click **Create** within the subscription group
2. Enter the **Reference Name** and **Product ID** from the tables above
3. Set the **Subscription Duration** to 1 Month
4. Under **Subscription Prices**, click **+** and set the price
5. Add **Localizations**: enter the Display Name and Description

### Step 3: Set Service Levels
1. In the subscription group, drag to reorder by value (highest first)
2. Enterprise Fleet > Family Protection > Constitutional Pro > Safety Pro

### Step 4: Add Non-Consumable (Basic Guard)
1. Go to **App Store Connect > Your App > In-App Purchases**
2. Click **+** to create a new In-App Purchase
3. Select **Non-Consumable**
4. Enter Reference Name: `Basic Guard`
5. Enter Product ID: `com.caren.safetyapp.basic_guard`
6. Set price to Tier 1 ($0.99)
7. Add localization with Display Name and Description

### Step 5: Review Information
For each product, you'll need:
- A **screenshot** of the purchase in your app (use the payment/pricing page)
- **Review notes**: "This in-app purchase unlocks premium legal protection features including GPS-enabled rights lookup, voice commands, and emergency response tools."

### Step 6: Submit for Review
- All in-app purchases must be submitted with a new app version or as an update
- Ensure the Apple Review account (applereview@caren.app / CarenReview2025!) has access to test all tiers

---

## Free Trial (Optional — Recommended)
Consider adding a **3-day or 7-day free trial** to Constitutional Pro to boost conversions:
- In the subscription settings, enable **Introductory Offers**
- Select **Free Trial** and set duration to 7 days
- This applies to new subscribers only

---

## Privacy & Compliance Notes
- Apple takes a 30% commission on all in-app purchases (15% for Small Business Program)
- Subscriptions auto-renew unless cancelled by the user 24 hours before renewal
- You must include a link to your Terms of Service and Privacy Policy
  - Privacy Policy: `https://carenalert.com/help`
  - Terms: Available in-app via Legal Agreement modal

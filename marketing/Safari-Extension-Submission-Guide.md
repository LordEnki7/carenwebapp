# C.A.R.E.N.™ ALERT Safari Web Extension — Build & Submission Guide

## What's Included

The `safari-extension/` folder contains the web extension source:

```
safari-extension/
├── manifest.json              # Manifest V3 configuration
├── icons/                     # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-256.png
│   └── icon-512.png
├── popup/                     # Browser toolbar popup
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/                # Background service worker
│   └── service-worker.js
└── content/                   # Content scripts (floating button)
    ├── content.js
    └── content.css
```

## Building on Mac with Xcode

### Prerequisites
- macOS 12+ (Monterey or later)
- Xcode 14+ (install from Mac App Store)
- Apple Developer account enrolled in Apple Developer Program
- Safari 15.4+ for Manifest V3 support

### Step 1: Download the Extension Files
Download the extension folder from the app or copy the `safari-extension/` directory to your Mac.

### Step 2: Convert to Xcode Project
Open Terminal on your Mac and run:

```bash
xcrun safari-web-extension-converter /path/to/safari-extension \
  --project-location ~/Desktop/CAREN-Safari-Xcode \
  --app-name "C.A.R.E.N.™ ALERT" \
  --bundle-identifier com.caren.safetyapp.safari-extension \
  --swift \
  --copy-resources \
  --no-open
```

**Important flags:**
- `--app-name` must be `"C.A.R.E.N.™ ALERT"` (matches the product name)
- `--bundle-identifier` should match your App Store Connect app
- `--swift` generates a Swift app wrapper
- `--copy-resources` copies extension files into the Xcode project
- `--no-open` prevents Xcode from auto-opening (optional)

### Step 3: Open and Configure in Xcode
```bash
open ~/Desktop/CAREN-Safari-Xcode/"C.A.R.E.N.™ ALERT"/"C.A.R.E.N.™ ALERT.xcodeproj"
```

In Xcode:
1. Select the project in the navigator (top-left)
2. Under **Signing & Capabilities** for BOTH targets (the app and the extension):
   - Select your **Team** (your Apple Developer account)
   - Ensure **Bundle Identifier** is correct:
     - App: `com.caren.safetyapp.safari-extension`
     - Extension: `com.caren.safetyapp.safari-extension.Extension`
3. Set **Deployment Target** to macOS 12.0 (or iOS 15.0 for iOS)
4. Under **General**, set:
   - **Display Name**: C.A.R.E.N.™ ALERT
   - **Version**: 1.0.0
   - **Build**: 1

### Step 4: Test Locally
1. In Xcode, select your Mac as the build target
2. Press **Cmd+R** to build and run
3. Safari will open — go to **Safari → Settings → Extensions**
4. Enable "C.A.R.E.N.™ ALERT" extension
5. The extension icon should appear in the Safari toolbar
6. Test: click the icon, verify popup loads, test SOS button, test rights display

**If you need to allow unsigned extensions during development:**
Safari → Develop menu → Allow Unsigned Extensions

### Step 5: Archive for App Store
1. In Xcode, select **Product → Archive**
2. Wait for the build to complete
3. In the **Organizer** window that opens, select the archive
4. Click **Distribute App**
5. Choose **App Store Connect**
6. Follow the prompts to upload

### Step 6: Configure in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app or create a new one with:
   - **App Name**: C.A.R.E.N.™ ALERT for Safari
   - **Subtitle**: Know Your Rights Instantly
   - **Bundle ID**: com.caren.safetyapp.safari-extension
   - **Category**: Utilities
   - **Privacy Policy URL**: http://www.carenalert.com/help
   - **Support URL**: https://carenalert.com/help
3. Add screenshots of the extension popup in Safari
4. Submit for review

## Common Build Issues & Fixes

### "No signing certificate found"
- Open Xcode → Settings → Accounts → add your Apple ID
- Xcode will auto-create certificates

### "Provisioning profile" errors
- In Signing & Capabilities, check "Automatically manage signing"
- Make sure both targets (app + extension) have your team selected

### "safari-web-extension-converter not found"
- Make sure Xcode Command Line Tools are installed:
  ```bash
  xcode-select --install
  ```

### Extension doesn't appear in Safari
- Make sure you enabled it: Safari → Settings → Extensions
- Check the "Allow Unsigned Extensions" option under Develop menu

## App Store Description (Suggested)

**Title**: C.A.R.E.N.™ ALERT for Safari

**Description**:
Know your legal rights instantly based on your location. C.A.R.E.N.™ ALERT (Citizen Assistance for Roadside Emergencies and Navigation) puts constitutional protection at your fingertips with a single click.

Features:
• GPS-based state detection with state-specific legal rights
• One-tap SOS emergency activation
• Rights organized by category: Traffic Stops, Recording Rights, Search & Seizure, Accountability
• Coverage for all 50 states with detailed statutes and case law references
• Quick-access floating button on every webpage
• Direct connection to the full C.A.R.E.N.™ ALERT emergency app

Your rights don't stop at the roadside — now they follow you everywhere you browse.

**Keywords**: legal rights, police, traffic stop, constitutional, emergency, roadside, attorney, recording rights, search seizure, 4th amendment

## Privacy Details for App Store

- **Data Collection**: Location (used on-device only for state detection)
- **Data Storage**: Extension stores preference settings locally only
- **Third-Party Services**: OpenStreetMap Nominatim for reverse geocoding
- **No Tracking**: Extension does not track users or share data

## Review Credentials
- **Demo Account**: applereview@caren.app / CarenReview2025!
- **Notes for Reviewer**: This extension provides location-based legal rights information. Allow location access when prompted to see state-specific rights. The SOS button opens the full C.A.R.E.N.™ ALERT web app.

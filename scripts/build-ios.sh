#!/bin/bash

# CAREN iOS Build Script for App Store Submission
# This script builds the web app and prepares iOS project for Xcode

echo "🏗️  Building CAREN for iOS App Store..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf ios/

# Build the web application
echo "📦 Building web application..."
npm run build

# Initialize Capacitor (if not already done)
if [ ! -f "capacitor.config.ts" ]; then
    echo "⚡ Initializing Capacitor..."
    npx cap init
fi

# Add iOS platform
echo "📱 Adding iOS platform..."
npx cap add ios

# Copy web assets to iOS
echo "📋 Copying web assets to iOS..."
npx cap copy ios

# Update iOS project
echo "🔄 Updating iOS project..."
npx cap update ios

# Apply iOS-specific configurations
echo "⚙️  Applying iOS configurations..."

# Create Info.plist additions
cat > ios-info-additions.plist << 'EOF'
<key>NSLocationWhenInUseUsageDescription</key>
<string>CAREN needs location access to provide location-aware legal rights and emergency services.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>CAREN needs location access for emergency features and legal documentation.</string>
<key>NSMicrophoneUsageDescription</key>
<string>CAREN uses microphone for voice commands and incident recording.</string>
<key>NSCameraUsageDescription</key>
<string>CAREN uses camera for incident documentation and evidence recording.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>CAREN accesses photos to attach evidence to incident reports.</string>
<key>NSContactsUsageDescription</key>
<string>CAREN accesses contacts to help set up emergency contacts.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>CAREN uses speech recognition for voice commands and hands-free operation during emergencies.</string>
<key>UIBackgroundModes</key>
<array>
    <string>background-processing</string>
    <string>background-fetch</string>
    <string>location</string>
</array>
<key>CFBundleDisplayName</key>
<string>CAREN</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
EOF

echo "✅ iOS build preparation complete!"
echo ""
echo "📋 Next Steps for App Store Submission:"
echo "1. Open ios/App/App.xcworkspace in Xcode"
echo "2. Set your Apple Developer Team in Signing & Capabilities"
echo "3. Update Bundle Identifier: com.caren.app (or your preferred ID)"
echo "4. Archive: Product → Archive"
echo "5. Upload to App Store Connect for TestFlight beta testing"
echo ""
echo "📱 iOS Project Location: ios/App/App.xcworkspace"
echo "🎯 Ready for Xcode Archive and App Store upload!"
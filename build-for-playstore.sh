#!/bin/bash

# C.A.R.E.N. Google Play Store Build Script
# This script builds your app for production Google Play Store submission

echo "🚀 C.A.R.E.N. Google Play Store Build Process"
echo "=============================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ NPX not found. Please install npm first."
    exit 1
fi

if ! command -v keytool &> /dev/null; then
    echo "❌ keytool not found. Please install Java JDK."
    exit 1
fi

echo "✅ All prerequisites found"

# Production URL configuration
PRODUCTION_URL="https://citizen-care-projectdna7.replit.app"
echo "🌐 Production URL: $PRODUCTION_URL"

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 2: Set production environment
echo ""
echo "🔧 Configuring production environment..."
export VITE_PRODUCTION_API_URL="$PRODUCTION_URL"
export NODE_ENV=production

# Step 3: Build frontend for production
echo ""
echo "🏗️ Building frontend for production..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Step 4: Copy to Capacitor
echo ""
echo "📱 Copying to Capacitor Android..."
npx cap copy android

if [ $? -ne 0 ]; then
    echo "❌ Capacitor copy failed!"
    exit 1
fi

# Step 5: Check for keystore configuration
echo ""
echo "🔑 Checking keystore configuration..."

if [ -z "$CAREN_KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore environment variables not set!"
    echo ""
    echo "Please run these commands first:"
    echo "export CAREN_KEYSTORE_FILE=\"/path/to/caren-release-key.keystore\""
    echo "export CAREN_KEYSTORE_PASSWORD=\"your-keystore-password\""
    echo "export CAREN_KEY_ALIAS=\"caren-release\""
    echo "export CAREN_KEY_PASSWORD=\"your-key-password\""
    echo ""
    read -p "Generate keystore now? (y/n): " generate_keystore
    
    if [ "$generate_keystore" = "y" ]; then
        echo "🔑 Generating release keystore..."
        keytool -genkey -v -keystore caren-release-key.keystore \
          -alias caren-release \
          -keyalg RSA \
          -keysize 2048 \
          -validity 10000
        
        if [ $? -eq 0 ]; then
            echo "✅ Keystore generated successfully!"
            echo "🔒 Please set environment variables and run this script again."
            echo "export CAREN_KEYSTORE_FILE=\"$(pwd)/caren-release-key.keystore\""
            exit 0
        else
            echo "❌ Keystore generation failed!"
            exit 1
        fi
    else
        echo "❌ Cannot proceed without keystore configuration."
        exit 1
    fi
fi

echo "✅ Keystore configuration found"

# Step 6: Open Android Studio
echo ""
echo "📱 Opening Android Studio..."
echo "Next steps in Android Studio:"
echo "1. Wait for project to load and sync"
echo "2. Go to Build > Generate Signed App Bundle (AAB)"
echo "3. Select your keystore: $CAREN_KEYSTORE_FILE"
echo "4. Enter your keystore and key passwords"
echo "5. Choose 'release' build variant"
echo "6. Click 'Finish' to generate AAB"
echo ""
echo "The AAB file will be saved to: android/app/release/app-release.aab"

npx cap open android

echo ""
echo "🎉 Build process complete!"
echo "=============================================="
echo "✅ Frontend built with production API: $PRODUCTION_URL"
echo "✅ Capacitor Android project ready"
echo "✅ Android Studio opened"
echo ""
echo "📤 After generating your AAB in Android Studio:"
echo "1. Upload the AAB file to Google Play Console"
echo "2. Complete your store listing"
echo "3. Submit for review"
echo ""
echo "🎯 Your C.A.R.E.N. app will be live on Google Play Store!"
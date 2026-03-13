#!/bin/bash

# CAREN Android Build Script for Google Play Store
# This script builds the web app and prepares Android project for release

echo "🤖 Building CAREN for Android Play Store..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf android/

# Build the web application
echo "📦 Building web application..."
npm run build

# Add Android platform
echo "📱 Adding Android platform..."
npx cap add android

# Copy web assets to Android
echo "📋 Copying web assets to Android..."
npx cap copy android

# Update Android project
echo "🔄 Updating Android project..."
npx cap update android

# Apply Android-specific configurations
echo "⚙️  Applying Android configurations..."

# Create Android manifest additions
cat > android-manifest-additions.xml << 'EOF'
<!-- Location permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Audio/Recording permissions -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Camera permissions -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- Storage permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Network permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

<!-- Notification permissions -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Background/Foreground service permissions -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<!-- Hardware features -->
<uses-feature android:name="android.hardware.location" android:required="true" />
<uses-feature android:name="android.hardware.location.gps" android:required="true" />
<uses-feature android:name="android.hardware.microphone" android:required="true" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
EOF

# Create build configuration for release
cat > android/app/build.gradle.release << 'EOF'
android {
    signingConfigs {
        release {
            if (project.hasProperty('CAREN_RELEASE_STORE_FILE')) {
                storeFile file(CAREN_RELEASE_STORE_FILE)
                storePassword CAREN_RELEASE_STORE_PASSWORD
                keyAlias CAREN_RELEASE_KEY_ALIAS
                keyPassword CAREN_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
EOF

echo "🔑 Generating signing key for release builds..."

# Create keystore for app signing (if not exists)
if [ ! -f "caren-release-key.keystore" ]; then
    echo "🔐 Creating release keystore..."
    keytool -genkey -v -keystore caren-release-key.keystore -alias caren-release-key -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=CAREN App, OU=Legal Tech, O=CAREN, L=City, S=State, C=US" \
        -storepass carenapp2025 -keypass carenapp2025
    
    echo "✅ Keystore created: caren-release-key.keystore"
    echo "⚠️  IMPORTANT: Keep this keystore file secure and backed up!"
fi

echo "✅ Android build preparation complete!"
echo ""
echo "📋 Next Steps for Google Play Store:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Build release APK/AAB: Build → Generate Signed Bundle/APK"
echo "3. Upload to Google Play Console for beta testing"
echo "4. Or use command line: ./gradlew bundleRelease"
echo ""
echo "📱 Android Project Location: android/"
echo "🎯 Ready for Google Play Store submission!"
echo ""
echo "🔑 Signing Configuration:"
echo "   Keystore: caren-release-key.keystore"
echo "   Alias: caren-release-key"
echo "   Password: carenapp2025 (change for production!)"
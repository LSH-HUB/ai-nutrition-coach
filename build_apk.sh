#!/bin/bash
# Build script for AI Nutrition Coach Android APK

echo "========================================"
echo "AI Nutrition Coach - Android APK Builder"
echo "========================================"
echo ""

# Navigate to script directory
cd "$(dirname "$0")"

# Navigate to mobile app directory
cd mobile_app

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Generate Android project if needed
if [ ! -d "android" ]; then
    echo "Generating Android project..."
    npx expo prebuild --platform android
fi

# Build the APK
echo "Building Android APK..."
cd android
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo ""
    echo "BUILD FAILED!"
    exit 1
fi

echo ""
echo "========================================"
echo "Build completed successfully!"
echo "========================================"
echo ""

# Copy APK to build folder
mkdir -p "../../build/android_apk"
cp "app/build/outputs/apk/release/app-release.apk" "../../build/android_apk/AI_Nutrition_Coach.apk"

if [ -f "../../build/android_apk/AI_Nutrition_Coach.apk" ]; then
    echo "APK copied to: build/android_apk/AI_Nutrition_Coach.apk"
fi

echo ""

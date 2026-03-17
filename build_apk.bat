@echo off
REM Build script for AI Nutrition Coach Android APK

echo ========================================
echo AI Nutrition Coach - Android APK Builder
echo ========================================
echo.

REM Check Java version
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java not found. Please install Java JDK 17+
    exit /b 1
)

echo Checking Java version...
java -version 2>&1 | findstr /C:"17" >nul
if errorlevel 1 (
    echo WARNING: Java 17+ recommended for Android builds
)

echo.
echo Starting build process...
echo.

REM Navigate to mobile app directory
cd /d "%~dp0mobile_app"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Generate Android project if needed
if not exist "android" (
    echo Generating Android project...
    call npx expo prebuild --platform android
)

REM Build the APK
echo Building Android APK...
cd android
call gradlew.bat assembleRelease

if errorlevel 1 (
    echo.
    echo BUILD FAILED!
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.

REM Copy APK to build folder
if not exist "..\..\build\android_apk" mkdir "..\..\build\android_apk"
copy /Y "app\build\outputs\apk\release\app-release.apk" "..\..\build\android_apk\AI_Nutrition_Coach.apk"

if exist "..\..\build\android_apk\AI_Nutrition_Coach.apk" (
    echo APK copied to: build\android_apk\AI_Nutrition_Coach.apk
) else (
    echo APK not found at expected location
)

echo.
pause

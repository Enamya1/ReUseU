@echo off
REM 🚀 Suki Mobile App - Setup Script for Windows
REM This script will help you set up the mobile app quickly

echo ╔════════════════════════════════════════════════════════════╗
echo ║        🎯 Suki Mobile App - Setup Wizard                  ║
echo ║        Complete React Native Transformation               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node -v
echo ✅ npm is installed
npm -v
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found.
    echo    Please run this script from the xiaowu_app directory.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
echo    This may take a few minutes...
echo.

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Check if env.local.ts exists
if not exist "env.local.ts" (
    echo ⚙️  Setting up environment configuration...
    
    if exist "env.example.ts" (
        copy env.example.ts env.local.ts >nul
        echo ✅ Created env.local.ts from template
        echo.
        echo ⚠️  IMPORTANT: You need to edit env.local.ts with your backend URLs
        echo.
        echo    1. Open env.local.ts in your editor
        echo    2. Replace YOUR_IP with your actual IP address
        echo    3. Example: http://192.168.1.100:8000
        echo.
        echo    To find your IP address, run: ipconfig
        echo.
    ) else (
        echo ❌ env.example.ts not found. Please create env.local.ts manually.
    )
) else (
    echo ✅ env.local.ts already exists
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    ✅ Setup Complete!                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📱 Next Steps:
echo.
echo 1. Configure Backend URLs:
echo    Edit env.local.ts with your backend IP addresses
echo.
echo 2. Start Backend Services:
echo    - Laravel Backend (Port 8000)
echo    - Python Backend (Port 8001)
echo.
echo 3. Run the App:
echo    npm start
echo.
echo 4. Choose Platform:
echo    - Press 'a' for Android
echo    - Press 'i' for iOS
echo    - Scan QR code with Expo Go app
echo.
echo 📚 Documentation:
echo    - README.md - Main documentation
echo    - IMPLEMENTATION_GUIDE.md - Detailed guide
echo    - ARCHITECTURE.md - Technical details
echo    - PROJECT_SUMMARY.md - Quick reference
echo.
echo 🎉 Happy Coding!
echo.
pause

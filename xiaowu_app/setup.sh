#!/bin/bash

# 🚀 Suki Mobile App - Setup Script
# This script will help you set up the mobile app quickly

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        🎯 Suki Mobile App - Setup Wizard                  ║"
echo "║        Complete React Native Transformation               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    echo "   Please run this script from the xiaowu_app directory."
    exit 1
fi

echo "📦 Installing dependencies..."
echo "   This may take a few minutes..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies."
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if env.local.ts exists
if [ ! -f "env.local.ts" ]; then
    echo "⚙️  Setting up environment configuration..."
    
    if [ -f "env.example.ts" ]; then
        cp env.example.ts env.local.ts
        echo "✅ Created env.local.ts from template"
        echo ""
        echo "⚠️  IMPORTANT: You need to edit env.local.ts with your backend URLs"
        echo ""
        echo "   1. Open env.local.ts in your editor"
        echo "   2. Replace YOUR_IP with your actual IP address"
        echo "   3. Example: http://192.168.1.100:8000"
        echo ""
        echo "   To find your IP address:"
        echo "   - Windows: ipconfig"
        echo "   - Mac/Linux: ifconfig"
        echo ""
    else
        echo "❌ env.example.ts not found. Please create env.local.ts manually."
    fi
else
    echo "✅ env.local.ts already exists"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ Setup Complete!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 Next Steps:"
echo ""
echo "1. Configure Backend URLs:"
echo "   Edit env.local.ts with your backend IP addresses"
echo ""
echo "2. Start Backend Services:"
echo "   - Laravel Backend (Port 8000)"
echo "   - Python Backend (Port 8001)"
echo ""
echo "3. Run the App:"
echo "   npm start"
echo ""
echo "4. Choose Platform:"
echo "   - Press 'a' for Android"
echo "   - Press 'i' for iOS"
echo "   - Scan QR code with Expo Go app"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Main documentation"
echo "   - IMPLEMENTATION_GUIDE.md - Detailed guide"
echo "   - ARCHITECTURE.md - Technical details"
echo "   - PROJECT_SUMMARY.md - Quick reference"
echo ""
echo "🎉 Happy Coding!"
echo ""

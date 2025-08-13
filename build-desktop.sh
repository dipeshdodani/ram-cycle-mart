#!/bin/bash

echo "🖥️  Building Ram Cycle Mart Desktop Application..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the Ram Cycle Mart root directory"
    exit 1
fi

# Create necessary directories
echo "📁 Setting up desktop build environment..."
mkdir -p desktop-app/dist-electron

# Install desktop dependencies
echo "📦 Installing Electron dependencies..."
cd desktop-app
npm install

# Go back to main directory and build the web application
echo "🔨 Building web application..."
cd ..
npm run build

# Copy built files to desktop app directory
echo "📋 Copying application files to desktop package..."
cp -r dist/* desktop-app/dist-web/
mkdir -p desktop-app/dist-web
cp -r dist/* desktop-app/dist-web/

# Create icons from SVG (requires conversion tools)
echo "🎨 Creating application icons..."
cd desktop-app

# Create icon files (you may need to install imagemagick: sudo apt install imagemagick)
if command -v convert &> /dev/null; then
    echo "Converting SVG icons to other formats..."
    
    # Create PNG icon
    convert assets/icon.svg -resize 256x256 assets/icon.png
    
    # Create ICO for Windows (requires additional steps)
    convert assets/icon.svg -resize 256x256 assets/icon-256.png
    convert assets/icon.svg -resize 128x128 assets/icon-128.png
    convert assets/icon.svg -resize 64x64 assets/icon-64.png
    convert assets/icon.svg -resize 32x32 assets/icon-32.png
    convert assets/icon.svg -resize 16x16 assets/icon-16.png
    
    # Combine into ICO file
    convert assets/icon-16.png assets/icon-32.png assets/icon-64.png assets/icon-128.png assets/icon-256.png assets/icon.ico
    
    echo "✅ Icons created successfully"
else
    echo "⚠️  ImageMagick not found. Using default SVG icon."
    echo "Install ImageMagick for better icon support: sudo apt install imagemagick"
    cp assets/icon.svg assets/icon.png
fi

# Build the desktop application
echo "🚀 Building desktop application..."

# For Windows (creates .exe installer)
npm run dist:win

echo ""
echo "✅ Desktop application build complete!"
echo ""
echo "📦 Output files:"
echo "   - Windows installer: desktop-app/dist-electron/Ram Cycle Mart Setup *.exe"
echo "   - Portable exe: desktop-app/dist-electron/RamCycleMart-Portable-*.exe"
echo ""
echo "📱 Application features:"
echo "   - Complete offline functionality"
echo "   - Local SQLite database"
echo "   - Data backup/restore capabilities"
echo "   - Native desktop experience"
echo "   - Auto-updater ready"
echo ""
echo "🎯 To run the application:"
echo "   1. Install the .exe file on any Windows computer"
echo "   2. Or use the portable version (no installation required)"
echo "   3. Application will start with embedded web server"
echo "   4. Access all features offline"
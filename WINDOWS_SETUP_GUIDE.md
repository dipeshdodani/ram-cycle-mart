# 🖥️ Windows Setup Guide for Ram Cycle Mart Desktop

## Quick Setup Instructions

### Step 1: Prerequisites
**Install Node.js (Required)**
1. Go to https://nodejs.org
2. Download "LTS" version (18.x or higher)
3. Run installer with default settings
4. Restart your computer after installation

**Verify Installation:**
```cmd
node --version
npm --version
```
Both should show version numbers.

### Step 2: Extract the Package
1. Right-click on `ram-cycle-mart-desktop.tar.gz`
2. Extract using WinRAR, 7-Zip, or Windows built-in extractor
3. You'll get a folder named `ram-cycle-mart-desktop`
4. Open this folder in File Explorer

### Step 3: Install Dependencies
1. Hold `Shift` and right-click in the folder
2. Select "Open PowerShell window here" or "Open command window here"
3. Run this command:
```cmd
npm install
```
This will download all required components (takes 2-3 minutes).

### Step 4: Build Your Desktop App
Run this command:
```cmd
npm run dist:win
```
This creates your .exe files (takes 5-10 minutes).

### Step 5: Get Your Applications
Find your apps in the `dist-electron` folder:
- **Ram Cycle Mart Setup 1.0.0.exe** - Full installer
- **RamCycleMart-Portable-1.0.0.exe** - Portable version

## Detailed Instructions

### If You Don't Have Node.js
**Download Node.js:**
1. Visit https://nodejs.org/en/download/
2. Click "Windows Installer" (.msi file)
3. Download the LTS version (recommended)
4. Run the installer
5. Accept all default settings
6. Click "Install" and wait for completion
7. Restart your computer

**Verify Installation:**
Open Command Prompt (type `cmd` in Start menu) and type:
```cmd
node --version
npm --version
```
You should see version numbers like:
```
v18.19.0
9.2.0
```

### If You Can't Extract .tar.gz Files
**Install 7-Zip (Free):**
1. Go to https://www.7-zip.org/
2. Download 7-Zip for Windows
3. Install with default settings
4. Right-click the .tar.gz file
5. Choose "7-Zip" → "Extract Here"

### Build Process Explained
When you run `npm run dist:win`, it will:
1. Create Windows installer (.exe)
2. Create portable application (.exe)
3. Package all dependencies
4. Create desktop shortcuts
5. Generate uninstaller

**Build Output:**
```
dist-electron/
├── Ram Cycle Mart Setup 1.0.0.exe    (~300MB installer)
├── RamCycleMart-Portable-1.0.0.exe   (~300MB portable)
└── win-unpacked/                      (folder version)
```

## Using Your Desktop App

### Installer Version
1. Double-click "Ram Cycle Mart Setup 1.0.0.exe"
2. Windows might show security warning (click "More info" → "Run anyway")
3. Follow installation wizard
4. App will appear in Start Menu and Desktop
5. Launch and create your first admin account

### Portable Version
1. Copy "RamCycleMart-Portable-1.0.0.exe" anywhere
2. Double-click to run (no installation needed)
3. Works from USB drives
4. Creates temporary data folder
5. Perfect for testing or mobile use

## Troubleshooting

### "Node.js is not recognized"
- Restart Command Prompt after installing Node.js
- Restart your computer
- Reinstall Node.js with "Add to PATH" option checked

### "npm install" fails
```cmd
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Build process fails
```cmd
# Check Node.js version (should be 18+)
node --version

# Clear everything and retry
rmdir node_modules /s
del package-lock.json
npm install
npm run dist:win
```

### Windows Defender warnings
- Normal for unsigned applications
- Click "More info" → "Run anyway"
- Or add exception in Windows Defender

### Application won't start
- Check Windows 10/11 required
- Ensure 4GB+ RAM available
- Close other applications using port 3000
- Try portable version instead

## What Happens When You Run the App

1. **Application starts** - Shows loading screen
2. **Server launches** - Embedded web server starts automatically
3. **Database initializes** - SQLite database created in user folder
4. **Browser opens** - Shows your cycle shop management system
5. **Ready to use** - Create admin account and start managing

## Data Storage Location
Your data is stored at:
```
C:\Users\[YourUsername]\AppData\Roaming\ram-cycle-mart-desktop\
```

## Next Steps After Setup

1. **Create admin account** - First user becomes administrator
2. **Add customers** - Start with a few test customers
3. **Setup inventory** - Add your cycle parts and tools
4. **Create work orders** - Test the repair workflow
5. **Generate invoices** - Try the billing system
6. **Backup data** - Use File → Backup Data menu

## Getting Help

**If build process fails:**
- Ensure Node.js 18+ is installed
- Check internet connection for npm install
- Try running Command Prompt as Administrator

**If application doesn't work:**
- Check system requirements (Windows 10/11)
- Ensure 4GB+ RAM available
- Try portable version first

**Contact Options:**
- Check documentation in the package
- Review troubleshooting section above
- Test with portable version to isolate issues
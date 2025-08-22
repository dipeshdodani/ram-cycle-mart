# Building Ram Cycle Mart Desktop Application

## Prerequisites

1. **Node.js 18+** installed on your system
2. **Git** installed
3. **Database** (PostgreSQL) connection string

## Step 1: Download the Project

### Option A: Download ZIP
1. Go to your GitHub repository
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file to a folder on your computer

### Option B: Git Clone
```bash
git clone https://github.com/yourusername/ram-cycle-mart.git
cd ram-cycle-mart
```

## Step 2: Install Dependencies

Open Command Prompt or Terminal in the project folder and run:

```bash
npm install
```

This will install all required packages including Electron.

## Step 3: Set Up Environment

1. Create a file named `.env` in the project root
2. Add your database connection:
```
DATABASE_URL=your_postgresql_connection_string_here
NODE_ENV=production
```

## Step 4: Build the Desktop Application

### For Windows (creates .exe file):
```bash
npm run build
npx electron-builder --win
```

### For macOS (creates .dmg file):
```bash
npm run build
npx electron-builder --mac
```

### For Linux (creates .AppImage file):
```bash
npm run build
npx electron-builder --linux
```

## Step 5: Find Your Executable

After building, you'll find your executable in the `dist-electron` folder:

- **Windows**: `Ram Cycle Mart Setup.exe`
- **macOS**: `Ram Cycle Mart.dmg`
- **Linux**: `Ram Cycle Mart.AppImage`

## Quick Build Script

Create a file named `build.bat` (Windows) or `build.sh` (Mac/Linux):

### Windows (build.bat):
```batch
@echo off
echo Installing dependencies...
npm install

echo Building application...
npm run build

echo Creating Windows executable...
npx electron-builder --win

echo Done! Check dist-electron folder for Ram Cycle Mart Setup.exe
pause
```

### Mac/Linux (build.sh):
```bash
#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Building application..."
npm run build

echo "Creating executable..."
npx electron-builder --mac  # or --linux for Linux

echo "Done! Check dist-electron folder for your executable"
```

## Troubleshooting

### Common Issues:

1. **"npm not found"**: Install Node.js from nodejs.org
2. **"Build failed"**: Make sure all dependencies are installed with `npm install`
3. **Database connection error**: Check your DATABASE_URL in .env file
4. **Permission denied**: Run terminal as administrator (Windows) or use `sudo` (Mac/Linux)

### For Database Setup:

If you don't have a PostgreSQL database, you can:
1. Use a free service like Neon.tech or Supabase
2. Install PostgreSQL locally
3. Use SQLite for testing (requires code changes)

## File Sizes

- Windows .exe: ~150-200MB
- macOS .dmg: ~150-200MB  
- Linux .AppImage: ~150-200MB

The executable includes everything needed to run the application, including Node.js runtime and all dependencies.

## Distribution

Once built, you can:
1. Share the executable file directly
2. Upload to cloud storage
3. Create an installer package
4. Distribute via your website

The executable is completely self-contained and doesn't require users to install anything else.
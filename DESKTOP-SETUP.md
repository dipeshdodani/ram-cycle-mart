# 🖥️ Ram Cycle Mart Desktop Application Setup

This guide will help you create a desktop executable (.exe file) for Ram Cycle Mart that you can install and run on any Windows computer.

## 🎯 What You'll Get

- **Windows Executable**: A `.exe` installer file
- **Standalone Application**: Works without internet after setup
- **Professional Interface**: Native desktop application with menus
- **Complete Features**: All web features available offline

## 📋 Requirements

- **Windows 10 or later** (for Windows .exe)
- **Node.js 18+** (download from [nodejs.org](https://nodejs.org))
- **5GB free disk space** (for building)
- **PostgreSQL database** (local or cloud)

## 🚀 Quick Start (Automated)

### Step 1: Download the Project
1. Download your project as ZIP from GitHub
2. Extract to a folder like `C:\RamCycleMart`
3. Open Command Prompt in that folder

### Step 2: Build Desktop App
```cmd
node build-desktop.js
```

That's it! The script will:
- Install all dependencies
- Create a sample .env file
- Build the desktop application
- Create the .exe installer

## 📂 Manual Step-by-Step Process

### Step 1: Install Dependencies
```cmd
npm install
```

### Step 2: Configure Database
Create a `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/ramcyclemart
NODE_ENV=production
```

### Step 3: Build Application
```cmd
npm run build
npx electron-builder --win
```

## 📁 Output Files

After building, check the `dist-electron` folder:
- **Ram Cycle Mart Setup.exe** - Main installer (150-200MB)
- **Latest.yml** - Update information file

## 🔧 Database Options

### Option 1: Local PostgreSQL
1. Install PostgreSQL from [postgresql.org](https://postgresql.org)
2. Create database: `ramcyclemart`
3. Use connection: `postgresql://postgres:password@localhost:5432/ramcyclemart`

### Option 2: Cloud Database (Recommended)
1. Create free account at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)
2. Create new project
3. Copy connection string to .env file

### Option 3: Offline Mode (Limited)
For demonstration without database:
```
DATABASE_URL=file:./local.db
```

## 📦 Distribution

### For Personal Use:
- Run `Ram Cycle Mart Setup.exe` on your computer
- Application installs to `Program Files`
- Creates desktop shortcut

### For Team/Business:
- Share the `.exe` file via:
  - Cloud storage (Google Drive, Dropbox)
  - Email (may need to compress first)
  - USB drive
  - Internal network

## 🛠️ Customization

### Change App Icon:
1. Replace `electron/assets/icon.ico` with your logo
2. Rebuild application

### Modify App Name:
1. Edit `electron-builder.json`
2. Change `productName` field
3. Rebuild application

## 🐛 Troubleshooting

### Build Fails:
```cmd
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
npm install
node build-desktop.js
```

### Database Connection Error:
- Verify DATABASE_URL is correct
- Test database connection separately
- Check firewall settings

### Permission Errors:
- Run Command Prompt as Administrator
- Check antivirus software isn't blocking

### Large File Size:
- Normal: 150-200MB (includes Node.js runtime)
- Compress with WinRAR/7zip for sharing

## 🔒 Security Notes

- Database credentials are stored in .env (not in executable)
- Application data stored in user profile
- No external dependencies required after installation

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all requirements are met
3. Try building on a different computer
4. Contact system administrator for enterprise setup

## 🎯 Next Steps

After successful build:
1. Test the executable on a clean Windows machine
2. Create user documentation
3. Set up database backup procedures
4. Plan for application updates

Your Ram Cycle Mart desktop application is now ready for professional use!
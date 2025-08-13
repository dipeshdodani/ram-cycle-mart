# 🖥️ Ram Cycle Mart Desktop Application Guide

## Overview

Convert your Ram Cycle Mart web application into a standalone Windows .exe file that works completely offline! No internet connection or web server required.

## What You Get

### Desktop Application Features
- **Complete Offline Functionality**: Works without internet
- **Native Windows Application**: Runs like any desktop software
- **Local Database**: SQLite database stored on local machine
- **Data Backup/Restore**: Built-in backup and restore features
- **Portable Version**: No installation required option
- **Auto-Updates**: Update mechanism built-in
- **Professional Installer**: Windows installer with shortcuts

### All Original Features Included
- Customer management with Gujarati transliteration
- Work order tracking and technician assignment
- Inventory management with stock alerts
- Dual billing system (Service & New Sale)
- GST calculations and professional PDF invoices
- Excel export functionality
- Dark/light theme toggle
- Role-based user access control

## Technical Architecture

### Electron Framework
- **Frontend**: Your existing React + TypeScript application
- **Backend**: Node.js Express server (embedded)
- **Database**: SQLite (embedded, no PostgreSQL required)
- **Package Size**: ~200-300MB (includes everything needed)
- **System Requirements**: Windows 10/11, 4GB RAM, 1GB storage

### How It Works
1. Electron wraps your web application in a native desktop container
2. Embedded Node.js server runs your backend automatically
3. Local SQLite database replaces PostgreSQL for offline use
4. Application starts with local web server on http://localhost:3000
5. Browser window opens automatically showing your application

## Build Process

### Option 1: Automated Build Script
```bash
# Run the build script
./build-desktop.sh
```

### Option 2: Manual Build Steps
```bash
# 1. Build web application
npm run build

# 2. Go to desktop directory
cd desktop-app

# 3. Install dependencies
npm install

# 4. Build desktop app
npm run dist:win
```

## Output Files

After building, you'll get:

### Windows Installer (.exe)
- **File**: `Ram Cycle Mart Setup 1.0.0.exe`
- **Size**: ~200-300MB
- **Features**: Full installation with desktop shortcuts, start menu entry
- **Best for**: Distribution to multiple users

### Portable Application (.exe)  
- **File**: `RamCycleMart-Portable-1.0.0.exe`
- **Size**: ~200-300MB
- **Features**: Single file, no installation required
- **Best for**: USB drives, temporary use, demo purposes

## Installation & Usage

### For End Users (Installing the App)

#### Method 1: Full Installation
1. Download `Ram Cycle Mart Setup 1.0.0.exe`
2. Run the installer (may trigger Windows Defender warning)
3. Follow installation wizard
4. Launch from desktop shortcut or start menu
5. Application starts automatically with local database

#### Method 2: Portable Version
1. Download `RamCycleMart-Portable-1.0.0.exe`
2. Place file anywhere (desktop, USB drive, etc.)
3. Double-click to run (no installation needed)
4. Application starts with temporary database

### First Run Setup
1. Application automatically starts backend server
2. Browser window opens showing login screen
3. Create your first admin account
4. Start using all features immediately
5. Data stored locally in: `%APPDATA%/ram-cycle-mart-desktop/`

## Data Management

### Local Database Location
**Windows**: `C:\Users\[Username]\AppData\Roaming\ram-cycle-mart-desktop\ramcyclemart.db`

### Backup & Restore
- **Backup**: File → Backup Data (exports .db file)
- **Restore**: File → Import Data (imports .db file)
- **Migration**: Copy .db file between computers
- **Schedule**: Set up automated backups as needed

### Data Migration from Web Version
1. Export data from web version (if using PostgreSQL)
2. Use database migration tools to convert to SQLite
3. Import into desktop application
4. Or manually recreate data in desktop version

## Distribution Options

### Internal Use (Single Business)
- Use portable version on multiple computers
- Share database file for synchronization
- Network share for centralized database

### Commercial Distribution
- Code sign the .exe file (prevents Windows warnings)
- Create proper installer with NSIS
- Set up auto-update mechanism
- Distribute through Microsoft Store (optional)

## Advanced Configuration

### Custom Database Location
Edit `main.js` to change database path:
```javascript
const dbPath = path.join('C:', 'MyBusiness', 'ramcyclemart.db');
```

### Network Database (Multi-User)
Configure to use network database instead of local SQLite:
```javascript
const env = {
  DATABASE_URL: 'postgresql://user:pass@server:5432/dbname'
};
```

### Custom Port Configuration
Change default port in `main.js`:
```javascript
const serverPort = 8080; // Change from 3000
```

## Troubleshooting

### Windows Defender Warnings
- **Cause**: Unsigned executable file
- **Solution**: Code signing certificate (~$200/year)
- **Workaround**: Users click "More info" → "Run anyway"

### Application Won't Start
- **Check**: Windows 10/11 required
- **Check**: Antivirus not blocking the file
- **Check**: Available disk space (1GB+)
- **Check**: Port 3000 not in use by other applications

### Database Issues
- **Location**: Check `%APPDATA%/ram-cycle-mart-desktop/`
- **Permissions**: Ensure write access to user folder
- **Corruption**: Use backup/restore to recover data

### Performance Optimization
- **Memory**: Application uses ~200-400MB RAM
- **Startup**: Initial startup takes 3-5 seconds
- **Database**: SQLite performance excellent for single-user

## Development & Customization

### Modifying the Desktop App
1. Edit files in `desktop-app/` directory
2. Rebuild with `npm run dist:win`
3. Test thoroughly before distribution

### Adding Features
- **File associations**: Register custom file types
- **System tray**: Minimize to system tray
- **Notifications**: Desktop notifications for alerts
- **Printing**: Direct printer integration

## Comparison: Web vs Desktop

| Feature | Web Version | Desktop Version |
|---------|-------------|-----------------|
| **Installation** | Server setup required | Single .exe file |
| **Internet** | Required | Not required |
| **Database** | PostgreSQL server | Local SQLite |
| **Multi-user** | Built-in | File sharing |
| **Updates** | Manual deployment | Auto-updater |
| **Security** | Server-based | Local file-based |
| **Backup** | Server backups | File-based backups |
| **Cost** | Hosting fees | One-time build |

## Next Steps

1. **Test the build process** with the provided scripts
2. **Create the desktop application** following this guide
3. **Test thoroughly** on different Windows versions
4. **Consider code signing** for professional distribution
5. **Create user documentation** for your specific workflow

The desktop version gives you complete independence from web hosting while maintaining all the powerful features of Ram Cycle Mart!
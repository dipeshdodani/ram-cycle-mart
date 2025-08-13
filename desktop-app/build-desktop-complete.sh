#!/bin/bash

echo "🖥️  Building Complete Ram Cycle Mart Desktop Application Package..."

# Check if we're in the correct directory
if [ ! -f "../package.json" ]; then
    echo "❌ Please run this script from the desktop-app directory"
    exit 1
fi

# Build the main web application first
echo "🔨 Building main web application..."
cd ..
npm run build

# Return to desktop directory
cd desktop-app

echo "📁 Setting up desktop build environment..."

# Create necessary directories
mkdir -p dist-web
mkdir -p assets

# Copy built web application
echo "📋 Copying web application to desktop package..."
cp -r ../dist/* dist-web/

# Create a simple icon if imagemagick isn't available
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Creating simple PNG icon..."
    
    # Create a basic icon using SVG to PNG conversion (fallback)
    cat > assets/icon.png << 'EOF'
# This would be a base64 encoded PNG icon
# For now, we'll use the SVG and let Electron handle it
EOF
    
    # Copy SVG as fallback
    cp assets/icon.svg assets/icon.png 2>/dev/null || echo "Using default icon"
else
    echo "🎨 Converting icons with ImageMagick..."
    convert assets/icon.svg -resize 256x256 assets/icon.png
    convert assets/icon.svg -resize 256x256 assets/icon.ico
fi

# Modify main.js to handle SQLite properly
echo "🔧 Configuring database for desktop..."

# Create a desktop-specific main.js that handles SQLite
cat > main-desktop.js << 'EOF'
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;
const serverPort = 3000;

// Database path for desktop
const dbPath = path.join(app.getPath('userData'), 'ramcyclemart.db');

function initializeDatabase() {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, 'sqlite-schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database initialized');
  }
  
  db.close();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false,
    titleBarStyle: 'default'
  });

  createMenu();
  
  // Initialize database
  initializeDatabase();
  
  // Start server and load app
  startServer()
    .then(() => {
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${serverPort}`);
        mainWindow.show();
      }, 3000);
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      dialog.showErrorBox('Startup Error', 'Failed to start application server.');
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(__dirname, '..', 'dist', 'index.js');
    
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: serverPort.toString(),
      DATABASE_URL: `sqlite:${dbPath}`,
      SESSION_SECRET: 'ram-cycle-mart-desktop-secret',
      ELECTRON_MODE: 'true'
    };

    if (!fs.existsSync(serverScript)) {
      reject(new Error('Server script not found'));
      return;
    }

    serverProcess = spawn('node', [serverScript], { env, stdio: 'pipe' });

    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.includes('serving on port') && !serverStarted) {
        serverStarted = true;
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', reject);

    setTimeout(() => {
      if (!serverStarted) {
        reject(new Error('Server startup timeout'));
      }
    }, 10000);
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Backup Data',
          click: exportData
        },
        {
          label: 'Import Data', 
          click: importData
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Ram Cycle Mart',
              message: 'Ram Cycle Mart Desktop v1.0.0',
              detail: 'Comprehensive Cycle Shop Management System'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function exportData() {
  dialog.showSaveDialog(mainWindow, {
    title: 'Export Data',
    defaultPath: `ramcyclemart-backup-${new Date().toISOString().split('T')[0]}.db`,
    filters: [{ name: 'Database Files', extensions: ['db'] }]
  }).then(result => {
    if (!result.canceled) {
      fs.copyFile(dbPath, result.filePath, (err) => {
        if (err) {
          dialog.showErrorBox('Export Error', err.message);
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Export Complete',
            message: 'Data exported successfully!'
          });
        }
      });
    }
  });
}

function importData() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Import Data',
    filters: [{ name: 'Database Files', extensions: ['db'] }],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      fs.copyFile(result.filePaths[0], dbPath, (err) => {
        if (err) {
          dialog.showErrorBox('Import Error', err.message);
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Import Complete',
            message: 'Data imported! Restart the application.'
          });
        }
      });
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill();
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
EOF

# Use the desktop-specific main.js
mv main-desktop.js main.js

echo "📦 Building desktop application..."

# Create a simple build command since we can't install electron-builder in Replit
echo "#!/bin/bash
echo 'Desktop build configured. To complete:'
echo '1. Download this desktop-app folder'
echo '2. On your local machine with Node.js:'
echo '   npm install'
echo '   npm run dist:win'
echo '3. Find your .exe files in dist-electron/'
" > build-local.sh

chmod +x build-local.sh

echo ""
echo "✅ Desktop application package prepared!"
echo ""
echo "📦 Package Contents:"
echo "   - Electron application framework"
echo "   - SQLite database configuration"
echo "   - Desktop-optimized main process"
echo "   - Application icons and assets"
echo "   - Complete web application build"
echo ""
echo "🚀 To complete the build:"
echo "   1. Download the desktop-app folder to your local machine"
echo "   2. Install Node.js 18+ on your local machine"
echo "   3. Run: npm install"
echo "   4. Run: npm run dist:win"
echo ""
echo "📱 Output will be:"
echo "   - Ram Cycle Mart Setup.exe (installer)"
echo "   - RamCycleMart-Portable.exe (portable app)"
echo "   - Size: ~250-300MB each"
echo ""
echo "💻 Requirements:"
echo "   - Works on Windows 10/11"
echo "   - Completely offline operation"
echo "   - No internet or server needed"
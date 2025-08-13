const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;
let serverProcess;
const isDev = process.env.NODE_ENV === 'development';
const serverPort = 3000;

// Database path for portable SQLite (alternative to PostgreSQL for offline use)
const dbPath = path.join(app.getPath('userData'), 'ramcyclemart.db');

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, 'assets', 'icon.png'), // App icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    frame: true
  });

  // Set application menu
  createMenu();

  // Start the backend server
  startServer()
    .then(() => {
      // Load the app - wait for server to be ready
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${serverPort}`);
        mainWindow.show();
      }, 2000);
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      showErrorDialog('Failed to start application server. Please check the logs.');
    });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== `http://localhost:${serverPort}`) {
      event.preventDefault();
    }
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverScript = path.join(__dirname, '..', 'dist', 'index.js');
    
    // Set environment variables for the server
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: serverPort.toString(),
      DATABASE_URL: `sqlite:${dbPath}`,
      SESSION_SECRET: 'ram-cycle-mart-desktop-secret-key',
      ELECTRON_MODE: 'true'
    };

    // Check if server script exists
    if (!fs.existsSync(serverScript)) {
      reject(new Error('Server script not found. Please build the application first.'));
      return;
    }

    // Start the server process
    serverProcess = spawn('node', [serverScript], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.includes('serving on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server process:', error);
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (code !== 0 && mainWindow) {
        showErrorDialog('Application server stopped unexpectedly.');
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
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
          click: () => {
            exportData();
          }
        },
        {
          label: 'Import Data',
          click: () => {
            importData();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Ram Cycle Mart',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Ram Cycle Mart',
              message: 'Ram Cycle Mart Desktop',
              detail: 'Comprehensive Cycle Shop Management System\nVersion 1.0.0\n\nOffline desktop application for managing your cycle repair business.'
            });
          }
        },
        {
          label: 'User Guide',
          click: () => {
            shell.openExternal('https://github.com/your-repo/ram-cycle-mart#readme');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function showErrorDialog(message) {
  dialog.showErrorBox('Ram Cycle Mart Error', message);
}

function exportData() {
  dialog.showSaveDialog(mainWindow, {
    title: 'Export Data',
    defaultPath: `ram-cycle-mart-backup-${new Date().toISOString().split('T')[0]}.db`,
    filters: [
      { name: 'Database Files', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.copyFile(dbPath, result.filePath, (err) => {
        if (err) {
          showErrorDialog('Failed to export data: ' + err.message);
        } else {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Export Successful',
            message: 'Data exported successfully!',
            detail: `Backup saved to: ${result.filePath}`
          });
        }
      });
    }
  });
}

function importData() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Import Data',
    filters: [
      { name: 'Database Files', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Confirm Import',
        message: 'This will replace all current data. Continue?',
        detail: 'Make sure you have a backup of your current data before proceeding.',
        buttons: ['Cancel', 'Import'],
        defaultId: 0,
        cancelId: 0
      }).then(response => {
        if (response.response === 1) {
          fs.copyFile(sourcePath, dbPath, (err) => {
            if (err) {
              showErrorDialog('Failed to import data: ' + err.message);
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Import Successful',
                message: 'Data imported successfully!',
                detail: 'Please restart the application to see the changes.'
              });
            }
          });
        }
      });
    }
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Terminate server process
  if (serverProcess) {
    serverProcess.kill();
  }
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Cleanup: terminate server process
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
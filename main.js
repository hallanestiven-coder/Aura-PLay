const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('renderer/index.html');
  mainWindow.webContents.openDevTools(); // Remove in production
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle file selection
ipcMain.handle('select-music-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

// Get music files from folder
ipcMain.handle('get-music-files', async (event, folderPath) => {
  if (!folderPath) return [];

  const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
  const files = [];

  try {
    const entries = fs.readdirSync(folderPath);
    entries.forEach((file) => {
      const ext = path.extname(file).toLowerCase();
      if (audioExtensions.includes(ext)) {
        files.push({
          name: path.basename(file, ext),
          path: path.join(folderPath, file),
          filename: file,
        });
      }
    });
  } catch (error) {
    console.error('Error reading folder:', error);
  }

  return files;
});

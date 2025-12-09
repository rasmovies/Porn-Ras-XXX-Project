const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { Client } = require('basic-ftp');
const fs = require('fs-extra');

// Streamtape FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('ftp-connect', async () => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    return { success: true, message: 'Bağlantı başarılı' };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('ftp-list', async (event, remotePath = '/') => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    const files = await client.list(remotePath);
    
    const fileList = files.map((file, index) => {
      let fileType = 'file';
      let fileSize = 0;
      let modifiedDate = null;
      let fileName = 'unknown';
      
      if (file.name) {
        fileName = String(file.name);
      } else if (file.rawName) {
        fileName = String(file.rawName);
      }
      
      if (file.type === 1 || file.type === 2) {
        fileType = 'directory';
      }
      
      if (file.size !== undefined && file.size !== null) {
        fileSize = parseInt(file.size) || 0;
      }
      
      if (file.modifiedAt) {
        modifiedDate = file.modifiedAt.toISOString();
      }
      
      return {
        name: fileName,
        type: fileType,
        size: fileSize,
        modified: modifiedDate
      };
    });
    
    return { success: true, files: fileList };
  } catch (error) {
    console.error('FTP list error:', error);
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('ftp-upload', async (event, localPath, remotePath) => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    await client.uploadFrom(localPath, remotePath);
    return { success: true, message: 'Dosya yüklendi' };
  } catch (error) {
    console.error('FTP upload error:', error);
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('ftp-download', async (event, remotePath, localPath) => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    await client.downloadTo(localPath, remotePath);
    return { success: true, message: 'Dosya indirildi' };
  } catch (error) {
    console.error('FTP download error:', error);
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('ftp-delete', async (event, remotePath) => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    await client.remove(remotePath);
    return { success: true, message: 'Dosya silindi' };
  } catch (error) {
    console.error('FTP delete error:', error);
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('ftp-move', async (event, fromPath, toPath) => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    await client.rename(fromPath, toPath);
    return { success: true, message: 'Dosya taşındı' };
  } catch (error) {
    console.error('FTP move error:', error);
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('ftp-mkdir', async (event, remotePath) => {
  const client = new Client();
  try {
    await client.access(FTP_CONFIG);
    await client.ensureDir(remotePath);
    return { success: true, message: 'Klasör oluşturuldu' };
  } catch (error) {
    console.error('FTP mkdir error:', error);
    return { success: false, error: error.message };
  } finally {
    client.close();
  }
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Yüklenecek Dosyaları Seç'
  });
  
  if (result.canceled) {
    return { success: false, files: [] };
  }
  
  return { success: true, files: result.filePaths };
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'İndirme Klasörü Seç'
  });
  
  if (result.canceled) {
    return { success: false, folder: null };
  }
  
  return { success: true, folder: result.filePaths[0] };
});


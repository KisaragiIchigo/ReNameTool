import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { scanPaths } from './services/fileScanner';
import { executeRenameBatch } from './services/renameEngine';
import { executeUndo, canUndo } from './services/undoManager';
import { ScanOptions } from '../src/types';

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  try {
    dialog.showErrorBox('Application Error (uncaughtException)', `${err.message}\n\n${err.stack}`);
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
  try {
    dialog.showErrorBox('Application Error (unhandledRejection)', String(reason));
  } catch {}
});

let mainWindow: BrowserWindow | null = null;

// 設定ファイルの保存場所: Portable時は実行EXEフォルダ/config、開発時はプロジェクト/config
function getConfigPath(): string {
  try {
    let baseDir = app.getAppPath();
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      baseDir = process.env.PORTABLE_EXECUTABLE_DIR;
    } else if (app.isPackaged) {
      baseDir = path.dirname(process.execPath);
    }
    const configDir = path.join(baseDir, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    return path.join(configDir, '[NovaRename]config.json');
  } catch (err) {
    const userDir = path.join(app.getPath('userData'), 'config');
    if (!fs.existsSync(userDir)) {
      try {
        fs.mkdirSync(userDir, { recursive: true });
      } catch {}
    }
    return path.join(userDir, '[NovaRename]config.json');
  }
}

function loadSavedConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return {};
}

function saveConfigToFile(config: any) {
  try {
    const configPath = getConfigPath();
    let existing = {};
    if (fs.existsSync(configPath)) {
      try {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch {
        existing = {};
      }
    }
    const merged = { ...existing, ...config };
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

function createWindow() {
  const appRoot = app.getAppPath();
  const savedConfig = loadSavedConfig();
  const bounds = savedConfig.windowBounds || { width: 1280, height: 820 };

  let preloadPath = path.join(appRoot, 'dist-electron', 'preload.cjs');
  if (!fs.existsSync(preloadPath)) {
    preloadPath = path.join(appRoot, 'dist-electron', 'preload.js');
  }

  const iconPath = path.join(appRoot, 'rename.ico');
  const icon = fs.existsSync(iconPath) ? iconPath : undefined;

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 960,
    minHeight: 640,
    title: 'NovaRename',
    icon,
    show: false,
    backgroundColor: '#F8FAFC',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    dialog.showErrorBox(
      'Page Load Error',
      `Failed to load URL: ${validatedURL}\nError: ${errorDescription} (${errorCode})`
    );
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      const currentBounds = mainWindow.getBounds();
      saveConfigToFile({ windowBounds: currentBounds });
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(appRoot, 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      dialog.showErrorBox('Failed to load index.html', `Path: ${indexPath}\nError: ${err.message}`);
    });
  }
}

app.whenReady().then(() => {
  ipcMain.handle('api:scan-paths', async (_, paths: string[], options: ScanOptions) => {
    return await scanPaths(paths, options);
  });

  ipcMain.handle('api:execute-rename', async (_, tasks: { originalPath: string; targetPath: string }[]) => {
    console.log('[Main IPC] Executing rename batch for', tasks.length, 'tasks');
    const res = await executeRenameBatch(tasks);
    console.log('[Main IPC] Rename result:', res);
    return res;
  });

  ipcMain.handle('api:execute-undo', async () => {
    return await executeUndo();
  });

  ipcMain.handle('api:can-undo', async () => {
    return canUndo();
  });

  ipcMain.handle('api:select-folder', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'multiSelections'],
    });
    return res.canceled ? null : res.filePaths;
  });

  ipcMain.handle('api:select-files', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
    });
    return res.canceled ? null : res.filePaths;
  });

  ipcMain.handle('api:load-config', async () => {
    return loadSavedConfig();
  });

  ipcMain.handle('api:save-config', async (_, config) => {
    return saveConfigToFile(config);
  });

  ipcMain.handle('api:open-in-explorer', async (_, targetPath: string) => {
    shell.showItemInFolder(targetPath);
  });

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

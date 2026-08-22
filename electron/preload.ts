import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { FileItem, RenameExecutionResult, ScanOptions } from '../src/types';

export interface ElectronAPI {
  scanPaths: (paths: string[], options: ScanOptions) => Promise<FileItem[]>;
  executeRename: (tasks: { originalPath: string; targetPath: string }[]) => Promise<RenameExecutionResult>;
  executeUndo: () => Promise<RenameExecutionResult>;
  canUndo: () => Promise<boolean>;
  selectFolder: () => Promise<string[] | null>;
  selectFiles: () => Promise<string[] | null>;
  loadConfig: () => Promise<any>;
  saveConfig: (config: any) => Promise<boolean>;
  openInExplorer: (targetPath: string) => Promise<void>;
  getPathForFile: (file: File) => string;
}

const api: ElectronAPI = {
  scanPaths: (paths, options) => ipcRenderer.invoke('api:scan-paths', paths, options),
  executeRename: (tasks) => ipcRenderer.invoke('api:execute-rename', tasks),
  executeUndo: () => ipcRenderer.invoke('api:execute-undo'),
  canUndo: () => ipcRenderer.invoke('api:can-undo'),
  selectFolder: () => ipcRenderer.invoke('api:select-folder'),
  selectFiles: () => ipcRenderer.invoke('api:select-files'),
  loadConfig: () => ipcRenderer.invoke('api:load-config'),
  saveConfig: (config) => ipcRenderer.invoke('api:save-config', config),
  openInExplorer: (targetPath) => ipcRenderer.invoke('api:open-in-explorer', targetPath),
  getPathForFile: (file) => webUtils.getPathForFile(file),
};

contextBridge.exposeInMainWorld('electronAPI', api);

import { ElectronAPI } from '../electron/preload';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

// Electron外（ブラウザプレビューなど）でのフォールバックモック
const mockAPI: ElectronAPI = {
  scanPaths: async (paths) => {
    return paths.map((p, idx) => {
      const parts = p.replace(/\\/g, '/').split('/');
      const fileName = parts[parts.length - 1];
      const dotIndex = fileName.lastIndexOf('.');
      const name = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
      const ext = dotIndex !== -1 ? fileName.substring(dotIndex + 1) : '';
      const dir = parts.slice(0, -1).join('/');

      return {
        id: `mock-${idx}-${Date.now()}`,
        originalPath: p,
        originalName: name,
        originalExt: ext,
        originalDir: dir || 'C:/SampleFolder',
        size: 1024 * (idx + 1),
        createdAt: Date.now() - 3600000 * 24 * idx,
        modifiedAt: Date.now() - 3600000 * idx,
        isDirectory: false,
        selected: true,
      };
    });
  },
  executeRename: async (tasks) => {
    console.log('Mock Rename Tasks:', tasks);
    return {
      success: true,
      total: tasks.length,
      succeeded: tasks.length,
      failed: 0,
      errors: [],
    };
  },
  executeUndo: async () => {
    return {
      success: true,
      total: 1,
      succeeded: 1,
      failed: 0,
      errors: [],
    };
  },
  canUndo: async () => true,
  selectFolder: async () => ['C:/SampleFolder'],
  selectFiles: async () => ['C:/SampleFolder/sample1.jpg', 'C:/SampleFolder/sample2.jpg'],
  loadConfig: async () => ({}),
  saveConfig: async () => true,
  openInExplorer: async () => {},
  getPathForFile: (file: File) => (file as any).path || file.name,
};

export const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);
if (!isElectron && typeof window !== 'undefined') {
  console.warn('[NovaRename] Running in mock/browser mode (window.electronAPI is undefined).');
}

export const api: ElectronAPI = window.electronAPI || mockAPI;

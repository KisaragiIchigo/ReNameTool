import { useState, useCallback } from 'react';
import { FileItem, ScanOptions } from '../types';
import { api } from '../api';

export function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    includeSubfolders: false,
    targetScope: 'files',
  });

  const addPaths = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return;
      setIsScanning(true);
      try {
        const scanned = await api.scanPaths(paths, scanOptions);
        setFiles((prev) => {
          const existingPathMap = new Set(prev.map((f) => f.originalPath));
          const newItems = scanned.filter((f) => !existingPathMap.has(f.originalPath));
          return [...prev, ...newItems];
        });
      } catch (err) {
        console.error('Failed to scan paths:', err);
      } finally {
        setIsScanning(false);
      }
    },
    [scanOptions]
  );

  const removeFiles = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected })));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const updateFileCustomName = useCallback((id: string, newName: string | undefined) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, customOverrideName: newName } : f))
    );
  }, []);

  const updateFilesAfterRename = useCallback(
    (renamedPairs: { fromPath: string; toPath: string }[]) => {
      const pairMap = new Map<string, string>();
      for (const pair of renamedPairs) {
        pairMap.set(pair.fromPath.toLowerCase(), pair.toPath);
      }

      setFiles((prev) =>
        prev.map((f) => {
          const newPath = pairMap.get(f.originalPath.toLowerCase());
          if (!newPath) return f;

          const parts = newPath.replace(/\\/g, '/').split('/');
          const fullFileName = parts[parts.length - 1];
          const lastDot = fullFileName.lastIndexOf('.');
          const name =
            lastDot !== -1 && !f.isDirectory
              ? fullFileName.substring(0, lastDot)
              : fullFileName;
          const ext =
            lastDot !== -1 && !f.isDirectory
              ? fullFileName.substring(lastDot + 1)
              : '';
          const dir = parts.slice(0, -1).join('\\');

          return {
            ...f,
            originalPath: newPath,
            originalName: name,
            originalExt: ext,
            originalDir: dir || f.originalDir,
            customOverrideName: undefined, // リネーム確定後は手動上書きをクリア
          };
        })
      );
    },
    []
  );

  return {
    files,
    setFiles,
    isScanning,
    scanOptions,
    setScanOptions,
    addPaths,
    removeFiles,
    toggleSelect,
    selectAll,
    clearFiles,
    updateFileCustomName,
    updateFilesAfterRename,
  };
}

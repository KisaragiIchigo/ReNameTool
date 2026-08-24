import { useState, useCallback } from 'react';
import { FileItem, ScanOptions, SortOption, SortField } from '../types';
import { api } from '../api';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function useFileList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    includeSubfolders: false,
    includeRootFolder: true,
    targetScope: 'files',
  });
  
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'none',
    order: 'asc',
  });

  const sortFilesArray = (items: FileItem[], field: SortField, order: 'asc' | 'desc') => {
    if (field === 'none') return items;
    
    return [...items].sort((a, b) => {
      let result = 0;
      switch (field) {
        case 'name':
          result = collator.compare(a.originalName, b.originalName);
          break;
        case 'dir':
          result = collator.compare(a.originalDir, b.originalDir);
          break;
        case 'size':
          result = a.size - b.size;
          break;
        case 'date':
          result = a.modifiedAt - b.modifiedAt;
          break;
      }
      return order === 'asc' ? result : -result;
    });
  };

  const handleSort = useCallback((field: SortField) => {
    setSortOption((prev) => {
      const order = prev.field === field && prev.order === 'asc' ? 'desc' : 'asc';
      setFiles((currentFiles) => sortFilesArray(currentFiles, field, order));
      return { field, order };
    });
  }, []);

  const addPaths = useCallback(
    async (paths: string[]) => {
      if (paths.length === 0) return;
      setIsScanning(true);
      try {
        const scanned = await api.scanPaths(paths, scanOptions);
        setFiles((prev) => {
          const existingPathMap = new Set(prev.map((f) => f.originalPath));
          const newItems = scanned.filter((f) => !existingPathMap.has(f.originalPath));
          
          const combined = [...prev, ...newItems];
          // もしソートが適用されていれば、追加時にもソートを維持
          if (sortOption.field !== 'none') {
            return sortFilesArray(combined, sortOption.field, sortOption.order);
          }
          return combined;
        });
      } catch (err) {
        console.error('Failed to scan paths:', err);
      } finally {
        setIsScanning(false);
      }
    },
    [scanOptions, sortOption]
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
    sortOption,
    handleSort,
    addPaths,
    removeFiles,
    toggleSelect,
    selectAll,
    clearFiles,
    updateFileCustomName,
    updateFilesAfterRename,
  };
}

import fs from 'node:fs';
import path from 'node:path';
import { FileItem, ScanOptions } from '../../src/types';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export async function scanPaths(paths: string[], options: ScanOptions): Promise<FileItem[]> {
  const result: FileItem[] = [];
  const visitedPaths = new Set<string>();

  async function processEntry(fullPath: string, isRootEntry: boolean = false) {
    if (visitedPaths.has(fullPath)) return;
    visitedPaths.add(fullPath);

    try {
      const stats = await fs.promises.stat(fullPath);
      const isDir = stats.isDirectory();

      if (isDir) {
        // フォルダ自体のリネーム対象への追加
        if (options.targetScope === 'folders' || options.targetScope === 'both') {
          // ルートディレクトリであり、includeRootFolderがfalseの場合はスキップする
          const shouldInclude = !(isRootEntry && options.includeRootFolder === false);
          
          if (shouldInclude) {
            const dirName = path.basename(fullPath);
            const parentDir = path.dirname(fullPath);
            result.push({
              id: `folder-${fullPath}-${Date.now()}-${Math.random()}`,
              originalPath: fullPath,
              originalName: dirName,
              originalExt: '',
              originalDir: parentDir,
              size: 0,
              createdAt: stats.birthtimeMs || stats.ctimeMs,
              modifiedAt: stats.mtimeMs,
              isDirectory: true,
              selected: true,
            });
          }
        }

        // ドロップされたルートフォルダ、または「サブフォルダを含む」がONの場合は中身を走査
        if (isRootEntry || options.includeSubfolders) {
          const entries = await fs.promises.readdir(fullPath);
          for (const entry of entries) {
            await processEntry(path.join(fullPath, entry), false);
          }
        }
      } else {
        // ファイルの追加
        if (options.targetScope === 'files' || options.targetScope === 'both') {
          const parsed = path.parse(fullPath);
          result.push({
            id: `file-${fullPath}-${Date.now()}-${Math.random()}`,
            originalPath: fullPath,
            originalName: parsed.name,
            originalExt: parsed.ext.replace(/^\./, ''),
            originalDir: parsed.dir,
            size: stats.size,
            createdAt: stats.birthtimeMs || stats.ctimeMs,
            modifiedAt: stats.mtimeMs,
            isDirectory: false,
            selected: true,
          });
        }
      }
    } catch (err) {
      console.error(`Error scanning path ${fullPath}:`, err);
    }
  }

  for (const p of paths) {
    await processEntry(path.resolve(p), true);
  }

  // 自然順ソートで整列
  result.sort((a, b) => {
    const dirCompare = collator.compare(a.originalDir, b.originalDir);
    if (dirCompare !== 0) return dirCompare;
    return collator.compare(a.originalName, b.originalName);
  });

  return result;
}

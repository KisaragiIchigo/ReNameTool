import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { RenameExecutionResult, HistoryRecord } from '../../src/types';
import { recordHistory } from './undoManager';

interface RenameTask {
  originalPath: string;
  targetPath: string;
}

export async function executeRenameBatch(tasks: RenameTask[]): Promise<RenameExecutionResult> {
  const result: RenameExecutionResult = {
    success: true,
    total: tasks.length,
    succeeded: 0,
    failed: 0,
    errors: [],
    renamedPairs: [],
  };

  if (tasks.length === 0) return result;

  const completedRenames: { fromPath: string; toPath: string }[] = [];

  for (const task of tasks) {
    const origNorm = path.normalize(task.originalPath);
    const targetNorm = path.normalize(task.targetPath);

    // 同一パスなら何もしない
    if (origNorm === targetNorm) {
      result.succeeded++;
      continue;
    }

    try {
      // 元ファイルの存在確認
      if (!fs.existsSync(origNorm)) {
        throw new Error(`元のファイルが存在しません: ${origNorm}`);
      }

      // ターゲットディレクトリが存在しない場合は作成
      const targetDir = path.dirname(targetNorm);
      if (!fs.existsSync(targetDir)) {
        await fs.promises.mkdir(targetDir, { recursive: true });
      }

      // Windowsの大文字小文字変更 (例: abc.txt -> ABC.txt) の判定
      const isCaseOnlyChange = origNorm.toLowerCase() === targetNorm.toLowerCase();

      if (isCaseOnlyChange) {
        // 大文字小文字のみの変更は一時ファイル名を経由
        const randomSuffix = crypto.randomBytes(4).toString('hex');
        const tempName = `__nova_temp_${randomSuffix}__`;
        const tempPath = path.join(targetDir, tempName);

        await fs.promises.rename(origNorm, tempPath);
        await fs.promises.rename(tempPath, targetNorm);
      } else {
        // 通常のリネーム
        await fs.promises.rename(origNorm, targetNorm);
      }

      completedRenames.push({ fromPath: origNorm, toPath: targetNorm });
      result.succeeded++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Rename failed for ${origNorm} -> ${targetNorm}:`, message);
      result.failed++;
      result.errors.push({ path: origNorm, error: message });
    }
  }

  // 成功したものをUndo履歴に登録
  if (completedRenames.length > 0) {
    const historyId = `hist-${Date.now()}`;
    const record: HistoryRecord = {
      id: historyId,
      timestamp: Date.now(),
      items: completedRenames,
    };
    recordHistory(record);
    result.historyId = historyId;
    result.renamedPairs = completedRenames;
  }

  result.success = result.failed === 0;
  return result;
}

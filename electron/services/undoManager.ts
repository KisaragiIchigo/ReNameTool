import fs from 'node:fs';
import { HistoryRecord, RenameExecutionResult } from '../../src/types';

// 最大保持履歴数
const MAX_HISTORY = 30;
let historyStack: HistoryRecord[] = [];

export function recordHistory(record: HistoryRecord) {
  historyStack.unshift(record);
  if (historyStack.length > MAX_HISTORY) {
    historyStack = historyStack.slice(0, MAX_HISTORY);
  }
}

export function getHistory(): HistoryRecord[] {
  return [...historyStack];
}

export function canUndo(): boolean {
  return historyStack.length > 0;
}

export async function executeUndo(): Promise<RenameExecutionResult> {
  const result: RenameExecutionResult = {
    success: true,
    total: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  if (historyStack.length === 0) {
    result.success = false;
    result.errors.push({ path: '', error: '元に戻す履歴がありません' });
    return result;
  }

  const latestRecord = historyStack.shift()!;
  result.total = latestRecord.items.length;
  const restoredPairs: { fromPath: string; toPath: string }[] = [];

  for (const item of latestRecord.items) {
    try {
      // toPath を fromPath に戻す
      await fs.promises.rename(item.toPath, item.fromPath);
      restoredPairs.push({ fromPath: item.toPath, toPath: item.fromPath });
      result.succeeded++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      result.failed++;
      result.errors.push({ path: item.toPath, error: message });
    }
  }

  result.renamedPairs = restoredPairs;
  result.success = result.failed === 0;
  return result;
}

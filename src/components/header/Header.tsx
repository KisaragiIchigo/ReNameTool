import React from 'react';
import {
  Trash2,
  RotateCcw,
  Play,
  Bookmark,
  HelpCircle,
  FolderSync,
} from 'lucide-react';
import { ScanOptions } from '../../types';

interface Props {
  fileCount: number;
  changedCount: number;
  canUndo: boolean;
  isExecuting: boolean;
  scanOptions: ScanOptions;
  setScanOptions: React.Dispatch<React.SetStateAction<ScanOptions>>;
  onClearFiles: () => void;
  onExecute: () => void;
  onUndo: () => void;
  onOpenPresets: () => void;
  onOpenRegexHelp: () => void;
}

export const Header: React.FC<Props> = ({
  fileCount,
  changedCount,
  canUndo,
  isExecuting,
  scanOptions,
  setScanOptions,
  onClearFiles,
  onExecute,
  onUndo,
  onOpenPresets,
  onOpenRegexHelp,
}) => {
  return (
    <header className="h-13 border-b border-slate-200 bg-white px-4 flex items-center justify-between select-none shadow-sm z-20 py-2.5">
      {/* 左側: アプリロゴ & スキャンオプション */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-primary flex items-center justify-center text-white shadow-sm font-bold text-sm">
            <FolderSync className="w-4 h-4" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-text-primary">
            NovaRename
          </h1>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* スキャンオプション */}
        <div className="flex items-center gap-3.5 text-xs text-text-secondary">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={scanOptions.includeSubfolders}
              onChange={(e) =>
                setScanOptions((prev) => ({
                  ...prev,
                  includeSubfolders: e.target.checked,
                }))
              }
              className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
            />
            <span className="text-xs font-medium">サブフォルダを含む</span>
          </label>

          {scanOptions.includeSubfolders && scanOptions.targetScope !== 'files' && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={scanOptions.includeRootFolder !== false}
                onChange={(e) =>
                  setScanOptions((prev) => ({
                    ...prev,
                    includeRootFolder: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
              />
              <span className="text-xs font-medium text-slate-500">親フォルダも含める</span>
            </label>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">対象:</span>
            <select
              value={scanOptions.targetScope}
              onChange={(e) =>
                setScanOptions((prev) => ({
                  ...prev,
                  targetScope: e.target.value as any,
                }))
              }
              className="h-7 px-2 text-xs rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary font-medium"
            >
              <option value="files">ファイルのみ</option>
              <option value="folders">フォルダのみ</option>
              <option value="both">ファイルとフォルダ</option>
            </select>
          </div>
        </div>
      </div>

      {/* 右側: プリセット・ヘルプ・Undo・実行 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
          title="プリセット一覧"
        >
          <Bookmark className="w-3.5 h-3.5 text-slate-600" />
          <span>プリセット</span>
        </button>

        <button
          onClick={onOpenRegexHelp}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-md transition-colors"
          title="正規表現リファレンス"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {fileCount > 0 && (
          <button
            onClick={onClearFiles}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="一覧をクリア"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>クリア</span>
          </button>
        )}

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Undoボタン */}
        <button
          onClick={onUndo}
          disabled={!canUndo || isExecuting}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-md text-text-secondary hover:text-text-primary hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
          title="直前のリネームを取り消す"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>元に戻す</span>
        </button>

        {/* 実行ボタン */}
        <button
          onClick={onExecute}
          disabled={changedCount === 0 || isExecuting}
          className="flex items-center gap-2 px-4 py-1.5 bg-accent-primary hover:bg-accent-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-md shadow-sm transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>リネーム実行</span>
          {changedCount > 0 && (
            <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {changedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

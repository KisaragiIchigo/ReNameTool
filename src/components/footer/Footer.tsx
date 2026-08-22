import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  totalFiles: number;
  selectedFiles: number;
  changedFiles: number;
  conflictFiles: number;
}

export const Footer: React.FC<Props> = ({
  totalFiles,
  selectedFiles,
  changedFiles,
  conflictFiles,
}) => {
  return (
    <footer className="h-9 border-t border-slate-200 bg-white px-4 flex items-center justify-between text-xs text-text-secondary select-none z-10">
      {/* 左側: 件数サマリ */}
      <div className="flex items-center gap-4 text-[11px]">
        <div>
          総ファイル数: <strong className="text-text-primary">{totalFiles}</strong> 件
          {selectedFiles !== totalFiles && (
            <span className="text-text-muted ml-1">
              (選択中: <strong className="text-accent-primary">{selectedFiles}</strong> 件)
            </span>
          )}
        </div>

        <div className="h-3.5 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span>
            変更予定: <strong className="text-green-700">{changedFiles}</strong> 件
          </span>
        </div>

        {conflictFiles > 0 && (
          <>
            <div className="h-3.5 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                重複自動回避: <strong>{conflictFiles}</strong> 件
              </span>
            </div>
          </>
        )}
      </div>

      {/* 右側: キーボードショートカットガイド */}
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
            Ctrl + Enter
          </kbd>
          <span>実行</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
            Ctrl + Z
          </kbd>
          <span>元に戻す</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
            Del
          </kbd>
          <span>リストから除外</span>
        </span>
      </div>
    </footer>
  );
};

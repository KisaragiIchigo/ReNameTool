import React from 'react';
import { DateTimeRule } from '../../../types';

interface Props {
  rule: DateTimeRule;
  onUpdate: (updater: Partial<DateTimeRule>) => void;
}

export const DateTimeCard: React.FC<Props> = ({ rule, onUpdate }) => {
  return (
    <div className="space-y-2.5 text-xs text-text-secondary">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            日時の取得元
          </label>
          <select
            value={rule.source}
            onChange={(e) => onUpdate({ source: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="modified">更新日時 (最終更新)</option>
            <option value="created">作成日時 (ファイル作成)</option>
            <option value="now">現在の日時 (実行時)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            フォーマット
          </label>
          <select
            value={rule.format}
            onChange={(e) => onUpdate({ format: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="YYYY_MM_DD-HH_mm_ss">2026_08_22-12_30_00</option>
            <option value="YYYYMMDD_HHmmss">20260822_123000</option>
            <option value="YYYY-MM-DD">2026-08-22 (日付のみ)</option>
            <option value="YYYYMMDD">20260822 (日付のみ)</option>
            <option value="custom">カスタム書式</option>
          </select>
        </div>
      </div>

      {rule.format === 'custom' && (
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            カスタム書式 (YYYY, MM, DD, HH, mm, ss)
          </label>
          <input
            type="text"
            value={rule.customFormat}
            onChange={(e) => onUpdate({ customFormat: e.target.value })}
            placeholder="例: [YYYY-MM-DD]_"
            className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            配置位置
          </label>
          <select
            value={rule.position}
            onChange={(e) => onUpdate({ position: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="prefix">先頭に追加</option>
            <option value="suffix">末尾に追加</option>
            <option value="full">フルリネーム (日時のみ)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            区切り文字
          </label>
          <input
            type="text"
            value={rule.separator}
            onChange={(e) => onUpdate({ separator: e.target.value })}
            placeholder="例: _, -, スペース"
            className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          />
        </div>
      </div>
    </div>
  );
};

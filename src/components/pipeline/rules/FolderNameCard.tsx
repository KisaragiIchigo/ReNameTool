import React from 'react';
import { FolderNameRule } from '../../../types';

interface Props {
  rule: FolderNameRule;
  onUpdate: (updater: Partial<FolderNameRule>) => void;
}

export const FolderNameCard: React.FC<Props> = ({ rule, onUpdate }) => {
  return (
    <div className="space-y-2.5 text-xs text-text-secondary">
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
            <option value="prefix">先頭に追加 (フォルダ名_名前)</option>
            <option value="suffix">末尾に追加 (名前_フォルダ名)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            区切り文字
          </label>
          <select
            value={rule.separator}
            onChange={(e) => onUpdate({ separator: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="_">アンダースコア (_)</option>
            <option value="-">ハイフン (-)</option>
            <option value=" ">半角スペース</option>
          </select>
        </div>
      </div>

      <div className="pt-1 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.includeParent}
            onChange={(e) => onUpdate({ includeParent: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span>親の親（2階層上位）のフォルダ名も連結して含める</span>
        </label>
      </div>
    </div>
  );
};

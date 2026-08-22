import React from 'react';
import { CaseTransformRule } from '../../../types';

interface Props {
  rule: CaseTransformRule;
  onUpdate: (updater: Partial<CaseTransformRule>) => void;
}

export const CaseTransformCard: React.FC<Props> = ({ rule, onUpdate }) => {
  return (
    <div className="space-y-2.5 text-xs text-text-secondary">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            変換タイプ
          </label>
          <select
            value={rule.transform}
            onChange={(e) => onUpdate({ transform: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="lowercase">小文字化 (lowercase)</option>
            <option value="uppercase">大文字化 (UPPERCASE)</option>
            <option value="titlecase">単語先頭を大文字 (Title Case)</option>
            <option value="snake_case">スネークケース (snake_case)</option>
            <option value="kebab-case">ケバブケース (kebab-case)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            対象範囲
          </label>
          <select
            value={rule.target}
            onChange={(e) => onUpdate({ target: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="all">ファイル名＋拡張子全体</option>
            <option value="name_only">ファイル名のみ</option>
            <option value="ext_only">拡張子のみ</option>
          </select>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SequenceRule } from '../../../types';

interface Props {
  rule: SequenceRule;
  onUpdate: (updater: Partial<SequenceRule>) => void;
}

export const SequenceCard: React.FC<Props> = ({ rule, onUpdate }) => {
  return (
    <div className="space-y-2.5 text-xs text-text-secondary">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            開始番号
          </label>
          <input
            type="number"
            value={rule.start}
            onChange={(e) => onUpdate({ start: parseInt(e.target.value, 10) || 1 })}
            className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            桁数 (ゼロ埋め)
          </label>
          <input
            type="number"
            min={1}
            max={8}
            value={rule.digits}
            onChange={(e) => onUpdate({ digits: parseInt(e.target.value, 10) || 1 })}
            className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            増分 (ステップ)
          </label>
          <input
            type="number"
            value={rule.step}
            onChange={(e) => onUpdate({ step: parseInt(e.target.value, 10) || 1 })}
            className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          />
        </div>
      </div>

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
            <option value="full">フルリネーム (連番のみ)</option>
            <option value="prefix">先頭に追加 (連番_元の名前)</option>
            <option value="suffix">末尾に追加 (元の名前_連番)</option>
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

      <div className="pt-1 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.resetPerFolder}
            onChange={(e) => onUpdate({ resetPerFolder: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span className="font-medium">フォルダごとに連番を 1 からリセットする</span>
        </label>
      </div>
    </div>
  );
};

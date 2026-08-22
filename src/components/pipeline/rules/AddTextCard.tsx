import React from 'react';
import { AddTextRule, WordHistoryMap } from '../../../types';
import { HistoryInput } from '../../common/HistoryInput';

interface Props {
  rule: AddTextRule;
  onUpdate: (updater: Partial<AddTextRule>) => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

export const AddTextCard: React.FC<Props> = ({
  rule,
  onUpdate,
  wordHistory = {},
  onAddWord = () => {},
  onRemoveWord = () => {},
}) => {
  return (
    <div className="space-y-2.5 text-xs text-text-secondary">
      <div>
        <label className="block text-[11px] font-medium text-text-muted mb-1">
          挿入するテキスト
        </label>
        <HistoryInput
          value={rule.text}
          onChange={(val) => onUpdate({ text: val })}
          placeholder="例: [保存版]_, -完成, _v2"
          category="add_text"
          historyList={wordHistory['add_text'] || []}
          onAddWord={onAddWord}
          onRemoveWord={onRemoveWord}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            挿入位置
          </label>
          <select
            value={rule.position}
            onChange={(e) => onUpdate({ position: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="prefix">先頭に追加</option>
            <option value="suffix">末尾に追加</option>
            <option value="index">指定文字数の位置に挿入</option>
          </select>
        </div>

        {rule.position === 'index' && (
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              文字位置 (インデックス)
            </label>
            <input
              type="number"
              min={0}
              value={rule.index ?? 0}
              onChange={(e) => onUpdate({ index: parseInt(e.target.value, 10) || 0 })}
              className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs font-mono"
            />
          </div>
        )}
      </div>
    </div>
  );
};

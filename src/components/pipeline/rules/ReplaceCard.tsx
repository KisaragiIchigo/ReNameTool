import React from 'react';
import { ReplaceRule, WordHistoryMap } from '../../../types';
import { HistoryInput } from '../../common/HistoryInput';

interface Props {
  rule: ReplaceRule;
  onUpdate: (updater: Partial<ReplaceRule>) => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

export const ReplaceCard: React.FC<Props> = ({
  rule,
  onUpdate,
  wordHistory = {},
  onAddWord = () => {},
  onRemoveWord = () => {},
}) => {
  return (
    <div className="space-y-2.5 text-xs text-text-secondary">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            検索する文字列
          </label>
          <HistoryInput
            value={rule.find}
            onChange={(val) => onUpdate({ find: val })}
            placeholder="例: IMG_, 変更前"
            category="find"
            historyList={wordHistory['find'] || []}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            置換後の文字列
          </label>
          <HistoryInput
            value={rule.replace}
            onChange={(val) => onUpdate({ replace: val })}
            placeholder="例: Photo_, 変更後 (空で削除)"
            category="replace"
            historyList={wordHistory['replace'] || []}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.useRegex}
            onChange={(e) => onUpdate({ useRegex: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span className="font-medium">正規表現 (RegEx)</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.matchCase}
            onChange={(e) => onUpdate({ matchCase: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span>大文字/小文字を区別</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.includeExtension}
            onChange={(e) => onUpdate({ includeExtension: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span>拡張子も対象に含める</span>
        </label>
      </div>
    </div>
  );
};

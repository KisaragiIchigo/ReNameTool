import React from 'react';
import { RemoveRangeRule, WordHistoryMap } from '../../../types';
import { HistoryInput } from '../../common/HistoryInput';

interface Props {
  rule: RemoveRangeRule;
  onUpdate: (updater: Partial<RemoveRangeRule>) => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

export const RemoveRangeCard: React.FC<Props> = ({
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
            開始文字（プレフィックス）
          </label>
          <HistoryInput
            value={rule.startChar}
            onChange={(val) => onUpdate({ startChar: val })}
            placeholder="例: [, （, _"
            category="surrounded_start"
            historyList={wordHistory['surrounded_start'] || ['[', '(', '【', '「', '_', '-']}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            終了文字（サフィックス）
          </label>
          <HistoryInput
            value={rule.endChar}
            onChange={(val) => onUpdate({ endChar: val })}
            placeholder="例: ], ）, （空で末尾まで）"
            category="surrounded_end"
            historyList={wordHistory['surrounded_end'] || [']', ')', '】', '」', '_', '-']}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        </div>
      </div>

      <div className="pt-1 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.includeEnclosingChars}
            onChange={(e) => onUpdate({ includeEnclosingChars: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span>囲み文字自体も一緒に削除する</span>
        </label>
      </div>
    </div>
  );
};

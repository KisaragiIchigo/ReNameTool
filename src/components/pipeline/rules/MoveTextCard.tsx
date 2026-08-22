import React from 'react';
import { MoveTextRule, WordHistoryMap } from '../../../types';
import { HistoryInput } from '../../common/HistoryInput';

interface Props {
  rule: MoveTextRule;
  onUpdate: (updater: Partial<MoveTextRule>) => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

export const MoveTextCard: React.FC<Props> = ({
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
            対象の文字 (検索語)
          </label>
          <HistoryInput
            value={rule.find}
            onChange={(val) => onUpdate({ find: val })}
            placeholder="例: 第\\d+話, [4K], 天気"
            category="move_find"
            historyList={wordHistory['move_find'] || []}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            動作モード
          </label>
          <select
            value={rule.action}
            onChange={(e) => onUpdate({ action: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="move">元の文字を削除して移動</option>
            <option value="copy">元の文字を残して追加</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            移動/追加先
          </label>
          <select
            value={rule.targetPos}
            onChange={(e) => onUpdate({ targetPos: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="start">先頭 (頭に追加)</option>
            <option value="end">末尾 (後ろに追加)</option>
            <option value="after_anchor">指定アンカー文字の後</option>
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
            <option value=" ">半角スペース</option>
            <option value="_">アンダースコア (_)</option>
            <option value="-">ハイフン (-)</option>
            <option value="">なし</option>
          </select>
        </div>
      </div>

      {rule.targetPos === 'after_anchor' && (
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              アンカー文字列 (この後ろに配置)
            </label>
            <HistoryInput
              value={rule.anchorText}
              onChange={(val) => onUpdate({ anchorText: val })}
              placeholder="例: タイトル_, _vol"
              category="move_anchor"
              historyList={wordHistory['move_anchor'] || []}
              onAddWord={onAddWord}
              onRemoveWord={onRemoveWord}
            />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
              <input
                type="checkbox"
                checked={rule.anchorRegex}
                onChange={(e) => onUpdate({ anchorRegex: e.target.checked })}
                className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
              />
              <span>アンカーに正規表現を使用</span>
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rule.useRegex}
            onChange={(e) => onUpdate({ useRegex: e.target.checked })}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
          />
          <span className="font-medium">対象文字に正規表現を使用</span>
        </label>

        {rule.action === 'move' && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rule.deleteAllFound}
              onChange={(e) => onUpdate({ deleteAllFound: e.target.checked })}
              className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5"
            />
            <span>マッチした全箇所を削除</span>
          </label>
        )}
      </div>
    </div>
  );
};

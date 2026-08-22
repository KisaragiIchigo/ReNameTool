import React from 'react';
import { ExtensionRule, WordHistoryMap } from '../../../types';
import { HistoryInput } from '../../common/HistoryInput';

interface Props {
  rule: ExtensionRule;
  onUpdate: (updater: Partial<ExtensionRule>) => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

export const ExtensionCard: React.FC<Props> = ({
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
            拡張子の変更モード
          </label>
          <select
            value={rule.mode}
            onChange={(e) => onUpdate({ mode: e.target.value as any })}
            className="w-full h-8 px-2 rounded border border-slate-200 bg-white text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs"
          >
            <option value="lowercase">小文字に統一 (例: .JPG → .jpg)</option>
            <option value="uppercase">大文字に統一 (例: .jpg → .JPG)</option>
            <option value="custom">別の拡張子に変換</option>
          </select>
        </div>

        {rule.mode === 'custom' && (
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">
              新しい拡張子
            </label>
            <HistoryInput
              value={rule.customExt}
              onChange={(val) => onUpdate({ customExt: val })}
              placeholder="例: png, webp, mp4"
              category="extension"
              historyList={wordHistory['extension'] || ['jpg', 'png', 'webp', 'mp4', 'zip']}
              onAddWord={onAddWord}
              onRemoveWord={onRemoveWord}
            />
          </div>
        )}
      </div>
    </div>
  );
};

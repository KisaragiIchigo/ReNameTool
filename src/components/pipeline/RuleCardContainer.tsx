import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  ChevronRight,
  Repeat,
  Scissors,
  ListOrdered,
  Calendar,
  Type,
  MoveHorizontal,
  CaseSensitive,
  FolderTree,
  FileCode,
} from 'lucide-react';
import { RenameRule, RuleType, WordHistoryMap } from '../../types';
import { ReplaceCard } from './rules/ReplaceCard';
import { RemoveRangeCard } from './rules/RemoveRangeCard';
import { SequenceCard } from './rules/SequenceCard';
import { DateTimeCard } from './rules/DateTimeCard';
import { AddTextCard } from './rules/AddTextCard';
import { MoveTextCard } from './rules/MoveTextCard';
import { CaseTransformCard } from './rules/CaseTransformCard';
import { FolderNameCard } from './rules/FolderNameCard';
import { ExtensionCard } from './rules/ExtensionCard';

interface Props {
  rule: RenameRule;
  index: number;
  total: number;
  onUpdate: (updater: Partial<RenameRule>) => void;
  onToggle: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

const RULE_ICONS: Record<RuleType, React.ReactNode> = {
  replace: <Repeat className="w-3.5 h-3.5 text-accent-primary" />,
  remove_range: <Scissors className="w-3.5 h-3.5 text-amber-500" />,
  sequence: <ListOrdered className="w-3.5 h-3.5 text-indigo-500" />,
  datetime: <Calendar className="w-3.5 h-3.5 text-emerald-500" />,
  add_text: <Type className="w-3.5 h-3.5 text-sky-500" />,
  move_text: <MoveHorizontal className="w-3.5 h-3.5 text-violet-500" />,
  case_transform: <CaseSensitive className="w-3.5 h-3.5 text-fuchsia-500" />,
  folder_name: <FolderTree className="w-3.5 h-3.5 text-teal-500" />,
  extension: <FileCode className="w-3.5 h-3.5 text-rose-500" />,
};

export const RuleCardContainer: React.FC<Props> = ({
  rule,
  index,
  total,
  onUpdate,
  onToggle,
  onRemove,
  onMoveUp,
  onMoveDown,
  wordHistory,
  onAddWord,
  onRemoveWord,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const renderContent = () => {
    switch (rule.type) {
      case 'replace':
        return (
          <ReplaceCard
            rule={rule}
            onUpdate={onUpdate}
            wordHistory={wordHistory}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        );
      case 'remove_range':
        return (
          <RemoveRangeCard
            rule={rule}
            onUpdate={onUpdate}
            wordHistory={wordHistory}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        );
      case 'sequence':
        return <SequenceCard rule={rule} onUpdate={onUpdate} />;
      case 'datetime':
        return <DateTimeCard rule={rule} onUpdate={onUpdate} />;
      case 'add_text':
        return (
          <AddTextCard
            rule={rule}
            onUpdate={onUpdate}
            wordHistory={wordHistory}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        );
      case 'move_text':
        return (
          <MoveTextCard
            rule={rule}
            onUpdate={onUpdate}
            wordHistory={wordHistory}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        );
      case 'case_transform':
        return <CaseTransformCard rule={rule} onUpdate={onUpdate} />;
      case 'folder_name':
        return <FolderNameCard rule={rule} onUpdate={onUpdate} />;
      case 'extension':
        return (
          <ExtensionCard
            rule={rule}
            onUpdate={onUpdate}
            wordHistory={wordHistory}
            onAddWord={onAddWord}
            onRemoveWord={onRemoveWord}
          />
        );
    }
  };

  return (
    <div
      className={`border rounded-lg bg-white transition-all shadow-sm ${
        rule.enabled ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
      }`}
    >
      {/* カードヘッダー */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 select-none bg-slate-50/70 rounded-t-lg">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={onToggle}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5 cursor-pointer"
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1.5 text-left font-semibold text-xs text-text-primary hover:text-accent-primary transition-colors"
          >
            {RULE_ICONS[rule.type]}
            <span>{rule.name}</span>
            <span className="text-[10px] font-mono text-text-muted bg-slate-200/70 px-1 rounded">
              #{index + 1}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="ルールを上に移動"
            className="p-1 text-text-muted hover:text-text-primary hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="ルールを下に移動"
            className="p-1 text-text-muted hover:text-text-primary hover:bg-slate-200 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            title="ルールを削除"
            className="p-1 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transform transition-transform ${
                collapsed ? '' : 'rotate-90'
              }`}
            />
          </button>
        </div>
      </div>

      {/* カードコンテンツ */}
      {!collapsed && <div className="p-3 bg-white rounded-b-lg">{renderContent()}</div>}
    </div>
  );
};

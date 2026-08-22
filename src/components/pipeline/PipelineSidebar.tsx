import React, { useState } from 'react';
import {
  Plus,
  Layers,
  Repeat,
  Scissors,
  ListOrdered,
  Calendar,
  Type,
  MoveHorizontal,
  CaseSensitive,
  FolderTree,
  FileCode,
  SlidersHorizontal,
} from 'lucide-react';
import { RenameRule, RuleType, WordHistoryMap } from '../../types';
import { RuleCardContainer } from './RuleCardContainer';

interface Props {
  width: number;
  rules: RenameRule[];
  onAddRule: (type: RuleType) => void;
  onUpdateRule: (id: string, updater: Partial<RenameRule>) => void;
  onRemoveRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onMoveRule: (fromIndex: number, toIndex: number) => void;
  wordHistory?: WordHistoryMap;
  onAddWord?: (category: string, word: string) => void;
  onRemoveWord?: (category: string, word: string) => void;
}

const AVAILABLE_RULES: { type: RuleType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'replace',
    label: '文字列置換',
    desc: '指定文字列や正規表現で置換・削除',
    icon: <Repeat className="w-4 h-4 text-accent-primary" />,
  },
  {
    type: 'remove_range',
    label: 'エリア文字削除',
    desc: 'カッコや記号で囲まれた範囲を一括消去',
    icon: <Scissors className="w-4 h-4 text-amber-500" />,
  },
  {
    type: 'sequence',
    label: '連番付与',
    desc: 'ゼロ埋め・ステップ・フォルダ別採番',
    icon: <ListOrdered className="w-4 h-4 text-indigo-500" />,
  },
  {
    type: 'datetime',
    label: '日付・時刻追加',
    desc: '作成日/更新日を自由な書式で埋め込み',
    icon: <Calendar className="w-4 h-4 text-emerald-500" />,
  },
  {
    type: 'add_text',
    label: 'テキスト追加',
    desc: '先頭・末尾・指定位置へ文字を追加',
    icon: <Type className="w-4 h-4 text-sky-500" />,
  },
  {
    type: 'move_text',
    label: '特定文字の移動・追加',
    desc: '検索語をアンカー位置や先頭/末尾へ移動',
    icon: <MoveHorizontal className="w-4 h-4 text-violet-500" />,
  },
  {
    type: 'case_transform',
    label: '大文字/小文字変換',
    desc: 'uppercase, snake_case, kebab-case 等',
    icon: <CaseSensitive className="w-4 h-4 text-fuchsia-500" />,
  },
  {
    type: 'folder_name',
    label: 'フォルダ名追加',
    desc: '親フォルダや上位階層の名称を付与',
    icon: <FolderTree className="w-4 h-4 text-teal-500" />,
  },
  {
    type: 'extension',
    label: '拡張子変更',
    desc: '拡張子の小文字統一や一括変換',
    icon: <FileCode className="w-4 h-4 text-rose-500" />,
  },
];

export const PipelineSidebar: React.FC<Props> = ({
  width,
  rules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  onToggleRule,
  onMoveRule,
  wordHistory,
  onAddWord,
  onRemoveWord,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex-shrink-0 h-full border-r border-slate-200 bg-slate-50/50 flex flex-col select-none"
    >
      {/* サイドバーヘッダー */}
      <div className="h-10 px-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-primary" />
          <span className="font-bold text-xs text-text-primary">変換パイプライン</span>
          <span className="text-[11px] font-mono text-text-muted bg-slate-100 px-1.5 py-0.5 rounded-full">
            {rules.filter((r) => r.enabled).length}/{rules.length}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary text-white text-xs font-medium rounded-md hover:bg-accent-primary-hover transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ルール追加</span>
          </button>

          {/* ルール追加ドロップダウン */}
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-dropdown z-50 py-1 max-h-[480px] overflow-y-auto">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-slate-100">
                  追加するルールを選択
                </div>
                {AVAILABLE_RULES.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      onAddRule(item.type);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <div className="text-xs font-medium text-text-primary">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-text-muted leading-tight">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ルールリスト領域 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {rules.length === 0 ? (
          <div className="h-48 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-4 text-center text-text-muted bg-white/50">
            <SlidersHorizontal className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-text-secondary">ルールが設定されていません</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              右上の「+ ルール追加」から変換処理を追加してください
            </p>
          </div>
        ) : (
          rules.map((rule, idx) => (
            <RuleCardContainer
              key={rule.id}
              rule={rule}
              index={idx}
              total={rules.length}
              onUpdate={(updater) => onUpdateRule(rule.id, updater)}
              onToggle={() => onToggleRule(rule.id)}
              onRemove={() => onRemoveRule(rule.id)}
              onMoveUp={() => onMoveRule(idx, idx - 1)}
              onMoveDown={() => onMoveRule(idx, idx + 1)}
              wordHistory={wordHistory}
              onAddWord={onAddWord}
              onRemoveWord={onRemoveWord}
            />
          ))
        )}
      </div>
    </div>
  );
};

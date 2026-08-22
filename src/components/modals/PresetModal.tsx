import React, { useState, useEffect } from 'react';
import { X, Bookmark, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import { Preset, RenameRule } from '../../types';
import { api } from '../../api';

interface Props {
  isOpen: boolean;
  currentRules: RenameRule[];
  onClose: () => void;
  onApplyPreset: (rules: RenameRule[]) => void;
}

const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'preset-photo',
    name: '写真・画像整理',
    description: '作成日時 (YYYYMMDD_HHmmss) を先頭に付与し、拡張子を小文字化',
    rules: [
      {
        id: 'p-photo-1',
        type: 'datetime',
        name: '日付・時刻追加',
        enabled: true,
        source: 'created',
        format: 'YYYYMMDD_HHmmss',
        customFormat: '',
        position: 'prefix',
        separator: '_',
      },
      {
        id: 'p-photo-2',
        type: 'extension',
        name: '拡張子小文字化',
        enabled: true,
        mode: 'lowercase',
        customExt: '',
      },
    ],
  },
  {
    id: 'preset-clean-tags',
    name: '先頭のカッコ・不要タグ削除',
    description: '[〇〇] や (〇〇) などのエリア文字を一括削除',
    rules: [
      {
        id: 'p-clean-1',
        type: 'remove_range',
        name: '角カッコ削除',
        enabled: true,
        startChar: '[',
        endChar: ']',
        includeEnclosingChars: true,
      },
      {
        id: 'p-clean-2',
        type: 'remove_range',
        name: '丸カッコ削除',
        enabled: true,
        startChar: '(',
        endChar: ')',
        includeEnclosingChars: true,
      },
      {
        id: 'p-clean-3',
        type: 'replace',
        name: '不要スペース除去',
        enabled: true,
        find: '^\\s+',
        replace: '',
        useRegex: true,
        matchCase: false,
        replaceAll: false,
        includeExtension: false,
      },
    ],
  },
  {
    id: 'preset-sequence-full',
    name: '純粋連番リネーム (4桁ゼロ埋め)',
    description: '0001, 0002... の形式でフォルダ毎に連番を付与',
    rules: [
      {
        id: 'p-seq-1',
        type: 'sequence',
        name: '連番付与',
        enabled: true,
        start: 1,
        step: 1,
        digits: 4,
        position: 'full',
        separator: '',
        resetPerFolder: true,
      },
    ],
  },
  {
    id: 'preset-folder-prefix',
    name: 'フォルダ名を先頭に追加 ＋ 連番',
    description: '<フォルダ名>_0001_元の名前 の形式に整理',
    rules: [
      {
        id: 'p-fp-1',
        type: 'folder_name',
        name: 'フォルダ名追加',
        enabled: true,
        position: 'prefix',
        includeParent: false,
        separator: '_',
      },
      {
        id: 'p-fp-2',
        type: 'sequence',
        name: '連番付与',
        enabled: true,
        start: 1,
        step: 1,
        digits: 4,
        position: 'prefix',
        separator: '_',
        resetPerFolder: true,
      },
    ],
  },
  {
    id: 'preset-web-clean',
    name: 'Web・プログラミング用クリーン',
    description: 'スペースをハイフンに、全文字を小文字（kebab-case）に変換',
    rules: [
      {
        id: 'p-wc-1',
        type: 'case_transform',
        name: 'ケバブケース変換',
        enabled: true,
        target: 'name_only',
        transform: 'kebab-case',
      },
      {
        id: 'p-wc-2',
        type: 'extension',
        name: '拡張子小文字化',
        enabled: true,
        mode: 'lowercase',
        customExt: '',
      },
    ],
  },
];

export const PresetModal: React.FC<Props> = ({
  isOpen,
  currentRules,
  onClose,
  onApplyPreset,
}) => {
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.loadConfig().then((cfg) => {
        if (cfg?.customPresets) {
          setCustomPresets(cfg.customPresets);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCustom = async () => {
    if (!newPresetName.trim()) return;
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'ユーザー定義プリセット',
      rules: JSON.parse(JSON.stringify(currentRules)),
    };
    const nextList = [...customPresets, newPreset];
    setCustomPresets(nextList);
    const cfg = await api.loadConfig();
    await api.saveConfig({ ...cfg, customPresets: nextList });
    setNewPresetName('');
    setNewPresetDesc('');
    setShowSaveForm(false);
  };

  const handleDeleteCustom = async (id: string) => {
    const nextList = customPresets.filter((p) => p.id !== id);
    setCustomPresets(nextList);
    const cfg = await api.loadConfig();
    await api.saveConfig({ ...cfg, customPresets: nextList });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-panel border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-accent-primary" />
            <h2 className="font-bold text-sm text-text-primary">プリセット / レシピ</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 現在のパイプラインを保存するセクション */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            {!showSaveForm ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-text-primary">
                    現在のルール構成をプリセットとして保存
                  </div>
                  <div className="text-[11px] text-text-muted">
                    設定中の {currentRules.length} 個のルールを保存してワンクリックで再利用できます
                  </div>
                </div>
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-text-primary text-xs font-semibold rounded-md shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-accent-primary" />
                  <span>新規保存</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="プリセット名 (例: 月末請求書整理)"
                  className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
                <input
                  type="text"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="説明 (任意)"
                  className="w-full h-8 px-2.5 rounded border border-slate-200 bg-white text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="px-2.5 py-1 text-xs text-text-muted hover:text-text-primary"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSaveCustom}
                    disabled={!newPresetName.trim()}
                    className="px-3 py-1 bg-accent-primary text-white text-xs font-semibold rounded hover:bg-accent-primary-hover disabled:opacity-40"
                  >
                    保存する
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* カスタムプリセット */}
          {customPresets.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                保存済みマイプリセット
              </div>
              <div className="space-y-2">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-text-primary">{preset.name}</div>
                      <div className="text-[11px] text-text-muted">{preset.description}</div>
                      <div className="text-[10px] text-accent-primary mt-1 font-mono">
                        ルール数: {preset.rules.length} 件
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteCustom(preset.id)}
                        className="p-1.5 text-text-muted hover:text-red-600 rounded transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          onApplyPreset(preset.rules);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-accent-primary text-white text-xs font-semibold rounded hover:bg-accent-primary-hover transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>適用</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 標準プリセット */}
          <div>
            <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>おすすめ標準レシピ</span>
            </div>
            <div className="space-y-2">
              {BUILTIN_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="border border-slate-200 rounded-lg p-3 bg-white hover:border-slate-300 flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-text-primary">{preset.name}</div>
                    <div className="text-[11px] text-text-muted">{preset.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {preset.rules.map((r) => r.name).join(' → ')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onApplyPreset(preset.rules);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-text-primary text-xs font-semibold rounded transition-colors"
                  >
                    <span>適用</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useMemo, useCallback } from 'react';
import { RenameRule, FileItem, PreviewItem, RuleType } from '../types';
import { generatePreviews } from '../utils/renameLogic';

const DEFAULT_RULES: RenameRule[] = [
  {
    id: 'default-replace',
    type: 'replace',
    name: '文字列置換',
    enabled: true,
    find: '',
    replace: '',
    useRegex: false,
    matchCase: false,
    replaceAll: true,
    includeExtension: false,
  },
];

export function useRenamePipeline(files: FileItem[]) {
  const [rules, setRules] = useState<RenameRule[]>(DEFAULT_RULES);

  const addRule = useCallback((type: RuleType) => {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    let newRule: RenameRule;
    switch (type) {
      case 'replace':
        newRule = {
          id,
          type: 'replace',
          name: '文字列置換',
          enabled: true,
          find: '',
          replace: '',
          useRegex: false,
          matchCase: false,
          replaceAll: true,
          includeExtension: false,
        };
        break;
      case 'remove_range':
        newRule = {
          id,
          type: 'remove_range',
          name: 'エリア文字削除',
          enabled: true,
          startChar: '[',
          endChar: ']',
          includeEnclosingChars: true,
        };
        break;
      case 'sequence':
        newRule = {
          id,
          type: 'sequence',
          name: '連番付与',
          enabled: true,
          start: 1,
          step: 1,
          digits: 4,
          position: 'full',
          separator: '_',
          resetPerFolder: false,
        };
        break;
      case 'datetime':
        newRule = {
          id,
          type: 'datetime',
          name: '日付・時刻追加',
          enabled: true,
          source: 'modified',
          format: 'YYYY_MM_DD-HH_mm_ss',
          customFormat: 'YYYYMMDD',
          position: 'prefix',
          separator: '_',
        };
        break;
      case 'add_text':
        newRule = {
          id,
          type: 'add_text',
          name: 'テキスト追加',
          enabled: true,
          text: '',
          position: 'prefix',
        };
        break;
      case 'move_text':
        newRule = {
          id,
          type: 'move_text',
          name: '特定文字の移動・追加',
          enabled: true,
          find: '',
          useRegex: false,
          action: 'move',
          targetPos: 'start',
          anchorText: '',
          anchorRegex: false,
          separator: ' ',
          deleteAllFound: false,
        };
        break;
      case 'case_transform':
        newRule = {
          id,
          type: 'case_transform',
          name: '大文字/小文字変換',
          enabled: true,
          target: 'all',
          transform: 'lowercase',
        };
        break;
      case 'folder_name':
        newRule = {
          id,
          type: 'folder_name',
          name: 'フォルダ名追加',
          enabled: true,
          position: 'prefix',
          includeParent: false,
          separator: '_',
        };
        break;
      case 'extension':
        newRule = {
          id,
          type: 'extension',
          name: '拡張子変更',
          enabled: true,
          mode: 'lowercase',
          customExt: '',
        };
        break;
    }

    setRules((prev) => [...prev, newRule]);
  }, []);

  const updateRule = useCallback((id: string, updater: Partial<RenameRule>) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, ...updater } as RenameRule) : r))
    );
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const moveRule = useCallback((fromIndex: number, toIndex: number) => {
    setRules((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  // 選択中ファイルのみプレビュー計算
  const selectedFiles = useMemo(() => files.filter((f) => f.selected), [files]);

  const previews = useMemo<PreviewItem[]>(() => {
    if (selectedFiles.length === 0) return [];
    return generatePreviews(selectedFiles, rules);
  }, [selectedFiles, rules]);

  return {
    rules,
    setRules,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    moveRule,
    previews,
  };
}

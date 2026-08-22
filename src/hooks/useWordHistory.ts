import { useState, useCallback, useEffect } from 'react';
import { WordHistoryCategory, WordHistoryMap } from '../types';
import { api } from '../api';

const DEFAULT_HISTORY: WordHistoryMap = {
  find: [],
  replace: [],
  surrounded_start: ['[', '(', '【', '「', '_', '-'],
  surrounded_end: [']', ')', '】', '」', '_', '-'],
  add_text: [],
  move_find: [],
  move_anchor: [],
  extension: ['jpg', 'png', 'webp', 'mp4', 'mkv', 'zip'],
  general: [],
};

export function useWordHistory() {
  const [history, setHistory] = useState<WordHistoryMap>(DEFAULT_HISTORY);

  // 初回読み込み
  useEffect(() => {
    async function loadHist() {
      try {
        const cfg = await api.loadConfig();
        if (cfg?.wordHistory) {
          setHistory((prev) => ({
            ...prev,
            ...cfg.wordHistory,
          }));
        }
      } catch (e) {
        console.error('Failed to load word history:', e);
      }
    }
    loadHist();
  }, []);

  // 履歴に追加
  const addWord = useCallback((category: WordHistoryCategory | string, word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      const currentList = prev[category] || [];
      const filtered = currentList.filter((w) => w !== trimmed);
      const nextList = [trimmed, ...filtered].slice(0, 30);
      const nextMap = {
        ...prev,
        [category]: nextList,
      };

      // 保存
      api.saveConfig({ wordHistory: nextMap }).catch(console.error);
      return nextMap;
    });
  }, []);

  // 履歴から削除
  const removeWord = useCallback((category: WordHistoryCategory | string, word: string) => {
    setHistory((prev) => {
      const currentList = prev[category] || [];
      const nextList = currentList.filter((w) => w !== word);
      const nextMap = {
        ...prev,
        [category]: nextList,
      };

      // 保存
      api.saveConfig({ wordHistory: nextMap }).catch(console.error);
      return nextMap;
    });
  }, []);

  return {
    history,
    addWord,
    removeWord,
  };
}

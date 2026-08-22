import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Clock } from 'lucide-react';
import { WordHistoryCategory } from '../../types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  category: WordHistoryCategory | string;
  historyList: string[];
  onAddWord: (category: WordHistoryCategory | string, word: string) => void;
  onRemoveWord: (category: WordHistoryCategory | string, word: string) => void;
  className?: string;
}

export const HistoryInput: React.FC<Props> = ({
  value,
  onChange,
  placeholder,
  category,
  historyList = [],
  onAddWord,
  onRemoveWord,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBlur = () => {
    if (value.trim()) {
      onAddWord(category, value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (value.trim()) {
        onAddWord(category, value.trim());
      }
      setIsOpen(false);
    }
  };

  const handleSelectWord = (word: string) => {
    onChange(word);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-8 pl-2.5 pr-7 rounded border border-slate-200 bg-white text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xs font-mono ${className}`}
        />

        {/* 履歴ドロップダウントグルボタン */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="過去の入力履歴から選択"
          className={`absolute right-1 p-1 text-slate-400 hover:text-accent-primary rounded transition-colors ${
            isOpen ? 'text-accent-primary bg-slate-100' : ''
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 履歴プルダウンメニュー */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-dropdown z-50 py-1 max-h-48 overflow-y-auto">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-text-muted flex items-center gap-1 border-b border-slate-100 uppercase tracking-wider">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>過去の入力履歴</span>
          </div>

          {historyList.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-text-muted text-center">
              履歴はありません
            </div>
          ) : (
            historyList.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 group cursor-pointer text-xs transition-colors"
                onClick={() => handleSelectWord(word)}
              >
                <span className="font-mono text-text-primary truncate flex-1 pr-2">
                  {word}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveWord(category, word);
                  }}
                  title="履歴から削除"
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 rounded transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

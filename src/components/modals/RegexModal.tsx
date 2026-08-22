import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const REGEX_TIPS = [
  { pattern: '^IMG_', meaning: '先頭が「IMG_」で始まる', example: 'IMG_001.jpg → 001.jpg' },
  { pattern: '\\d+', meaning: '1文字以上の連続する数字', example: 'ep12_v2.mp4 → 数字部分に一致' },
  { pattern: '\\[.*?\\]', meaning: '角カッコと中身の最短一致', example: '[720p] title.mp4 → [720p]' },
  { pattern: '\\s+', meaning: '1文字以上の連続するスペース', example: 'my  file.pdf → スペース部分' },
  { pattern: '^[0-9]{4}-[0-9]{2}', meaning: '先頭の年-月 (例: 2026-08)', example: '2026-08-01.txt' },
  { pattern: '(?<=\\d)_(?=\\d)', meaning: '数字に挟まれたアンダースコア', example: '01_02.png → 0102.png' },
];

export const RegexModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-panel border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-primary" />
            <h2 className="font-bold text-sm text-text-primary">正規表現 (RegEx) クイックリファレンス</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <p className="text-xs text-text-muted">
            置換ルールや文字移動ルールで「正規表現」をオンにすると、以下のパターンを用いた柔軟な一致・置換が可能になります。
          </p>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-text-muted font-semibold">
                <tr>
                  <th className="p-2.5">パターン</th>
                  <th className="p-2.5">意味・用途</th>
                  <th className="p-2.5">例</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {REGEX_TIPS.map((tip, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-accent-primary font-bold text-[11px]">{tip.pattern}</td>
                    <td className="p-2.5 text-text-secondary font-sans text-[11px]">{tip.meaning}</td>
                    <td className="p-2.5 text-text-muted text-[11px]">{tip.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-900 leading-relaxed font-sans">
            <strong>ヒント:</strong> 置換後の文字列に <code>$1</code>, <code>$2</code> を指定すると、検索パターンのカッコ <code>( )</code> でグループ化した部分を参照して並び替えることができます。
          </div>
        </div>
      </div>
    </div>
  );
};

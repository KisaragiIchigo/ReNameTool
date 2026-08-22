import React from 'react';
import { UploadCloud } from 'lucide-react';

interface Props {
  isDragging: boolean;
}

export const FileDropZone: React.FC<Props> = ({ isDragging }) => {
  return (
    <div
      className={`h-full w-full flex flex-col items-center justify-center p-8 text-center transition-all ${
        isDragging
          ? 'bg-blue-50/80 border-2 border-dashed border-accent-primary'
          : 'bg-white'
      }`}
    >
      <div className="max-w-sm w-full flex flex-col items-center space-y-3.5">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-accent-primary shadow-sm border border-slate-200">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-text-primary">
            ここにファイルまたはフォルダをドロップ
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            エクスプローラーから直接ドラッグ＆ドロップして一覧に追加できます
          </p>
        </div>
      </div>
    </div>
  );
};

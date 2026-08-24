import React, { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  ExternalLink,
  Trash2,
  Search,
  Edit2,
  Copy,
  RotateCcw,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { FileItem, PreviewItem, ColumnWidths } from '../../types';
import { DiffView } from './DiffView';
import { api } from '../../api';

interface Props {
  files: FileItem[];
  previews: PreviewItem[];
  filterQuery: string;
  setFilterQuery: (q: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (selected: boolean) => void;
  onRemoveFiles: (ids: string[]) => void;
  onUpdateFileCustomName: (id: string, newName: string | undefined) => void;
  columnWidths: ColumnWidths;
  setColumnWidths: React.Dispatch<React.SetStateAction<ColumnWidths>>;
  sortOption: { field: import('../../types').SortField; order: import('../../types').SortOrder };
  onSort: (field: import('../../types').SortField) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  file: FileItem;
  preview?: PreviewItem;
}

export const PreviewTable: React.FC<Props> = ({
  files,
  previews,
  filterQuery,
  setFilterQuery,
  onToggleSelect,
  onSelectAll,
  onRemoveFiles,
  onUpdateFileCustomName,
  columnWidths,
  setColumnWidths,
  sortOption,
  onSort,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // プレビューのマップを作成
  const previewMap = React.useMemo(() => {
    const map = new Map<string, PreviewItem>();
    for (const p of previews) {
      map.set(p.id, p);
    }
    return map;
  }, [previews]);

  // フィルタリング
  const filteredFiles = React.useMemo(() => {
    if (!filterQuery) return files;
    const q = filterQuery.toLowerCase();
    return files.filter((f) => {
      const p = previewMap.get(f.id);
      const original = f.originalExt ? `${f.originalName}.${f.originalExt}` : f.originalName;
      const target = p ? p.newFullName : original;
      return (
        original.toLowerCase().includes(q) ||
        target.toLowerCase().includes(q) ||
        f.originalDir.toLowerCase().includes(q)
      );
    });
  }, [files, filterQuery, previewMap]);

  const rowVirtualizer = useVirtualizer({
    count: filteredFiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 20,
  });

  const allSelected = files.length > 0 && files.every((f) => f.selected);
  const someSelected = files.some((f) => f.selected) && !allSelected;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // 列リサイズのハンドラー
  const handleResizeStart = (
    colKey: keyof ColumnWidths,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ダブルクリックによるインライン編集開始
  const handleStartEdit = (file: FileItem) => {
    const preview = previewMap.get(file.id);
    const originalFull = file.originalExt ? `${file.originalName}.${file.originalExt}` : file.originalName;
    const currentTarget = file.customOverrideName || (preview ? preview.newFullName : originalFull);

    setEditingId(file.id);
    setEditingValue(currentTarget);
  };

  // インライン編集の保存
  const handleSaveEdit = (fileId: string) => {
    const trimmed = editingValue.trim();
    if (trimmed) {
      onUpdateFileCustomName(fileId, trimmed);
    }
    setEditingId(null);
  };

  // 右クリックコンテキストメニュー
  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    const preview = previewMap.get(file.id);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
      preview,
    });
  };

  // コピー処理
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`${label} をコピーしました`);
    setContextMenu(null);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // 外部クリックでメニュー閉じる
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const totalGridTemplate = `40px ${columnWidths.status}px ${columnWidths.original}px ${columnWidths.preview}px ${columnWidths.folder}px ${columnWidths.size}px ${columnWidths.actions}px minmax(0, 1fr)`;

  const SortIndicator = ({ field }: { field: import('../../types').SortField }) => {
    if (sortOption.field !== field) return null;
    return sortOption.order === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden relative">
      {/* テーブル上部バー */}
      <div className="h-10 px-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 select-none">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="ファイル名・フォルダで絞り込み..."
            className="w-full h-7 pl-8 pr-2.5 rounded border border-slate-200 bg-white text-xs text-text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="text-[11px] text-slate-400">
            ダブルクリック: ファイル名手動編集 / 列の境界線をドラッグで幅変更
          </span>
          <span>
            表示: <strong className="text-text-primary">{filteredFiles.length}</strong> / {files.length} 件
          </span>
        </div>
      </div>

      {/* テーブルヘッダー（列リサイズ対応） */}
      <div
        style={{ gridTemplateColumns: totalGridTemplate }}
        className="h-9 border-b border-slate-200 bg-slate-100/80 grid items-center text-[11px] font-semibold text-text-secondary select-none px-2 relative min-w-full"
      >
        {/* 全選択 */}
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5 cursor-pointer"
          />
        </div>

        {/* 状態 */}
        <div className="px-2 relative flex items-center justify-between h-full">
          <span>状態</span>
          <div
            onMouseDown={(e) => handleResizeStart('status', e)}
            className="w-1.5 h-full cursor-col-resize hover:bg-accent-primary/50 absolute right-0 top-0"
          />
        </div>

        {/* 変更前のファイル名 */}
        <div 
          className="px-2 relative flex items-center justify-between h-full cursor-pointer hover:text-text-primary"
          onClick={() => onSort('name')}
        >
          <div className="flex items-center">
            <span>変更前のファイル名</span>
            <SortIndicator field="name" />
          </div>
          <div
            onMouseDown={(e) => handleResizeStart('original', e)}
            className="w-1.5 h-full cursor-col-resize hover:bg-accent-primary/50 absolute right-0 top-0"
          />
        </div>

        {/* 変更後のプレビュー (Diff) */}
        <div className="px-2 relative flex items-center justify-between h-full">
          <span>変更後のプレビュー (Diff)</span>
          <div
            onMouseDown={(e) => handleResizeStart('preview', e)}
            className="w-1.5 h-full cursor-col-resize hover:bg-accent-primary/50 absolute right-0 top-0"
          />
        </div>

        {/* フォルダ */}
        <div 
          className="px-2 relative flex items-center justify-between h-full cursor-pointer hover:text-text-primary"
          onClick={() => onSort('dir')}
        >
          <div className="flex items-center">
            <span>フォルダ</span>
            <SortIndicator field="dir" />
          </div>
          <div
            onMouseDown={(e) => handleResizeStart('folder', e)}
            className="w-1.5 h-full cursor-col-resize hover:bg-accent-primary/50 absolute right-0 top-0"
          />
        </div>

        {/* サイズ */}
        <div 
          className="px-2 text-right relative flex items-center justify-between h-full cursor-pointer hover:text-text-primary"
          onClick={() => onSort('size')}
        >
          <div className="flex items-center">
            <span>サイズ</span>
            <SortIndicator field="size" />
          </div>
          <div
            onMouseDown={(e) => handleResizeStart('size', e)}
            className="w-1.5 h-full cursor-col-resize hover:bg-accent-primary/50 absolute right-0 top-0"
          />
        </div>

        {/* 操作 */}
        <div className="px-2 text-center">操作</div>
        <div></div>
      </div>

      {/* テーブルボディ（仮想化リスト & テキスト選択可能） */}
      <div ref={parentRef} className="flex-1 overflow-y-auto relative divide-y divide-slate-100 select-text">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const file = filteredFiles[virtualRow.index];
            const preview = previewMap.get(file.id);
            const originalFull = file.originalExt ? `${file.originalName}.${file.originalExt}` : file.originalName;
            const isEditing = editingId === file.id;
            const hasCustomOverride = Boolean(file.customOverrideName);

            return (
              <div
                key={file.id}
                onContextMenu={(e) => handleContextMenu(e, file)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: totalGridTemplate,
                }}
                className={`grid items-center text-xs px-2 hover:bg-slate-50 transition-colors ${
                  !file.selected ? 'opacity-40 bg-slate-50/40' : preview?.hasConflict ? 'bg-amber-50/40' : ''
                }`}
              >
                {/* 選択チェックボックス */}
                <div className="flex items-center justify-center select-none">
                  <input
                    type="checkbox"
                    checked={file.selected}
                    onChange={() => onToggleSelect(file.id)}
                    className="rounded border-slate-300 text-accent-primary focus:ring-accent-primary h-3.5 w-3.5 cursor-pointer"
                  />
                </div>

                {/* 状態ステータスバッジ */}
                <div className="px-2 select-none flex items-center gap-1 flex-wrap">
                  {hasCustomOverride && (
                    <span
                      className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200"
                      title="個別に手動修正済み（パイプラインの一括変換も重ねて適用されます）"
                    >
                      <Edit2 className="w-2.5 h-2.5 text-purple-600" />
                      <span>手動</span>
                    </span>
                  )}
                  {preview?.hasConflict ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200"
                      title={preview.conflictReason}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>重複回避</span>
                    </span>
                  ) : preview?.isChanged ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-100/80 px-1.5 py-0.5 rounded border border-green-200">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>変更あり</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-slate-100 px-1.5 py-0.5 rounded">
                      <MinusCircle className="w-3 h-3 text-slate-400" />
                      <span>変更なし</span>
                    </span>
                  )}
                </div>

                {/* 変更前の名前 (ダブルクリックで編集 / コピー可能) */}
                <div
                  onDoubleClick={() => handleStartEdit(file)}
                  className="px-2 truncate font-mono text-text-secondary text-[11px] cursor-text select-text hover:text-text-primary"
                  title={`${originalFull}\n(ダブルクリックで手動編集)`}
                >
                  {originalFull}
                </div>

                {/* 変更後のプレビュー (Diff / インライン編集) */}
                <div
                  onDoubleClick={() => handleStartEdit(file)}
                  className="px-2 truncate font-mono text-xs select-text cursor-text"
                  title={preview ? preview.newFullName : originalFull}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(file.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleSaveEdit(file.id)}
                        className="h-6 w-full px-1.5 border border-accent-primary rounded bg-white text-xs font-mono text-text-primary focus:outline-none ring-1 ring-accent-primary"
                      />
                      <button
                        onClick={() => handleSaveEdit(file.id)}
                        className="p-1 bg-accent-primary text-white rounded hover:bg-accent-primary-hover"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : preview ? (
                    <DiffView parts={preview.diffParts} isChanged={preview.isChanged} />
                  ) : (
                    <span className="text-text-muted">{originalFull}</span>
                  )}
                </div>

                {/* フォルダ名 */}
                <div
                  className="px-2 truncate text-text-muted text-[11px] select-text"
                  title={file.originalDir}
                >
                  {file.originalDir.split(/[\\/]/).pop() || file.originalDir}
                </div>

                {/* ファイルサイズ */}
                <div className="px-2 text-right font-mono text-[11px] text-text-muted select-none">
                  {formatFileSize(file.size)}
                </div>

                {/* 操作アイコン */}
                <div className="px-2 flex items-center justify-center gap-1 select-none">
                  {hasCustomOverride && (
                    <button
                      onClick={() => onUpdateFileCustomName(file.id, undefined)}
                      title="自動ルール変換に戻す"
                      className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleStartEdit(file)}
                    title="手動でリネーム修正"
                    className="p-1 text-slate-400 hover:text-accent-primary hover:bg-slate-200 rounded transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => api.openInExplorer(file.originalPath)}
                    title="エクスプローラーで表示"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFiles([file.id])}
                    title="リストから除外"
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右クリックコンテキストメニュー */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-dropdown py-1 text-xs text-text-primary min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const target = contextMenu.preview ? contextMenu.preview.newFullName : contextMenu.file.originalName;
              copyToClipboard(target, '変更後ファイル名');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-accent-primary" />
            <span>変更後のファイル名をコピー</span>
          </button>
          <button
            onClick={() => {
              const original = contextMenu.file.originalExt
                ? `${contextMenu.file.originalName}.${contextMenu.file.originalExt}`
                : contextMenu.file.originalName;
              copyToClipboard(original, '変更前ファイル名');
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>変更前のファイル名をコピー</span>
          </button>
          <button
            onClick={() => copyToClipboard(contextMenu.file.originalPath, 'フルパス')}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>フルパスをコピー</span>
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={() => {
              handleStartEdit(contextMenu.file);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 text-accent-primary font-medium"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>手動で名前を直接編集</span>
          </button>
          <button
            onClick={() => {
              api.openInExplorer(contextMenu.file.originalPath);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>エクスプローラーで表示</span>
          </button>
        </div>
      )}

      {/* コピー完了トースト */}
      {copyFeedback && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-panel animate-bounce-short">
          {copyFeedback}
        </div>
      )}
    </div>
  );
};

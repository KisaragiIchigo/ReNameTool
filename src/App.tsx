import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/header/Header';
import { PipelineSidebar } from './components/pipeline/PipelineSidebar';
import { PreviewTable } from './components/preview/PreviewTable';
import { FileDropZone } from './components/preview/FileDropZone';
import { Footer } from './components/footer/Footer';
import { PresetModal } from './components/modals/PresetModal';
import { RegexModal } from './components/modals/RegexModal';
import { useFileList } from './hooks/useFileList';
import { useRenamePipeline } from './hooks/useRenamePipeline';
import { useWordHistory } from './hooks/useWordHistory';
import { ColumnWidths, ReplaceRule, RemoveRangeRule, AddTextRule, MoveTextRule, ExtensionRule } from './types';
import { api } from './api';

const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  status: 90,
  original: 340,
  preview: 380,
  folder: 160,
  size: 75,
  actions: 90,
};

export const App: React.FC = () => {
  const {
    files,
    scanOptions,
    setScanOptions,
    addPaths,
    removeFiles,
    toggleSelect,
    selectAll,
    clearFiles,
    updateFileCustomName,
    updateFilesAfterRename,
  } = useFileList();

  const {
    rules,
    setRules,
    addRule,
    updateRule,
    removeRule,
    toggleRule,
    moveRule,
    previews,
  } = useRenamePipeline(files);

  const { history: wordHistory, addWord, removeWord } = useWordHistory();

  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_COLUMN_WIDTHS);
  const [filterQuery, setFilterQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [canUndoState, setCanUndoState] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isRegexModalOpen, setIsRegexModalOpen] = useState(false);

  const isConfigLoadedRef = useRef(false);

  // 起動時に保存済み設定（ルール構成・スキャンオプション・幅）を復元
  useEffect(() => {
    async function initConfig() {
      try {
        const saved = await api.loadConfig();
        if (saved) {
          if (Array.isArray(saved.rules) && saved.rules.length > 0) {
            setRules(saved.rules);
          }
          if (saved.scanOptions) {
            setScanOptions(saved.scanOptions);
          }
          if (typeof saved.sidebarWidth === 'number') {
            setSidebarWidth(saved.sidebarWidth);
          }
          if (saved.columnWidths) {
            setColumnWidths(saved.columnWidths);
          }
        }
      } catch (e) {
        console.error('Failed to load saved config:', e);
      } finally {
        isConfigLoadedRef.current = true;
      }
    }
    initConfig();
  }, [setRules, setScanOptions]);

  // ルールやオプション、幅が変更されたら config.json に自動保存 (debounce)
  useEffect(() => {
    if (!isConfigLoadedRef.current) return;

    const timer = setTimeout(() => {
      api.saveConfig({
        rules,
        scanOptions,
        sidebarWidth,
        columnWidths,
      }).catch((e) => console.error('Failed to auto-save config:', e));
    }, 400);

    return () => clearTimeout(timer);
  }, [rules, scanOptions, sidebarWidth, columnWidths]);

  // サイドバースプリッター（境界線のドラッグリサイズ）
  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(260, Math.min(650, startWidth + deltaX));
      setSidebarWidth(newWidth);
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

  // Undo状態確認
  const checkUndo = useCallback(async () => {
    try {
      const u = await api.canUndo();
      setCanUndoState(u);
    } catch {
      setCanUndoState(false);
    }
  }, []);

  useEffect(() => {
    checkUndo();
  }, [checkUndo]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 全画面ドラッグ＆ドロップ
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files) {
        const droppedPaths: string[] = [];
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          let p = '';
          try {
            p = api.getPathForFile(file);
          } catch {
            p = (file as any).path || '';
          }
          if (p) droppedPaths.push(p);
        }
        if (droppedPaths.length > 0) {
          await addPaths(droppedPaths);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addPaths]);

  // 一括リネーム実行
  const handleExecute = async () => {
    const changedItems = previews.filter((p) => p.isChanged);
    if (changedItems.length === 0) return;

    // 入力ワードを履歴に自動登録
    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.type === 'replace') {
        const r = rule as ReplaceRule;
        if (r.find) addWord('find', r.find);
        if (r.replace) addWord('replace', r.replace);
      } else if (rule.type === 'remove_range') {
        const r = rule as RemoveRangeRule;
        if (r.startChar) addWord('surrounded_start', r.startChar);
        if (r.endChar) addWord('surrounded_end', r.endChar);
      } else if (rule.type === 'add_text') {
        const r = rule as AddTextRule;
        if (r.text) addWord('add_text', r.text);
      } else if (rule.type === 'move_text') {
        const r = rule as MoveTextRule;
        if (r.find) addWord('move_find', r.find);
        if (r.anchorText) addWord('move_anchor', r.anchorText);
      } else if (rule.type === 'extension') {
        const r = rule as ExtensionRule;
        if (r.customExt) addWord('extension', r.customExt);
      }
    }

    setIsExecuting(true);
    try {
      const tasks = changedItems.map((p) => ({
        originalPath: p.fileItem.originalPath,
        targetPath: p.targetPath,
      }));

      const res = await api.executeRename(tasks);
      if (res.success) {
        showToast(`${res.succeeded} 件のファイルをリネームしました`, 'success');
        if (res.renamedPairs && res.renamedPairs.length > 0) {
          updateFilesAfterRename(res.renamedPairs);
        }
        await checkUndo();
      } else {
        const firstError = res.errors[0]?.error || 'リネームに失敗しました';
        showToast(`一部の処理に失敗しました (${res.succeeded}件成功 / ${res.failed}件失敗): ${firstError}`, 'error');
        if (res.renamedPairs && res.renamedPairs.length > 0) {
          updateFilesAfterRename(res.renamedPairs);
        }
        await checkUndo();
      }
    } catch (err: any) {
      showToast(`エラーが発生しました: ${err.message || String(err)}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Undo 実行
  const handleUndo = async () => {
    setIsExecuting(true);
    try {
      const res = await api.executeUndo();
      if (res.success) {
        showToast(`前回の実行を取り消しました (${res.succeeded} 件のファイルを復元)`, 'success');
        if (res.renamedPairs && res.renamedPairs.length > 0) {
          updateFilesAfterRename(res.renamedPairs);
        }
        await checkUndo();
      } else {
        showToast(`元に戻す処理に失敗しました: ${res.errors[0]?.error || '不明なエラー'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Undoエラー: ${err.message || String(err)}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // キーボードショートカット (Ctrl+Enter, Ctrl+Z, Del)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndoState) handleUndo();
      } else if (e.key === 'Delete') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          const selectedIds = files.filter((f) => f.selected).map((f) => f.id);
          if (selectedIds.length > 0) {
            removeFiles(selectedIds);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const selectedCount = files.filter((f) => f.selected).length;
  const changedCount = previews.filter((p) => p.isChanged).length;
  const conflictCount = previews.filter((p) => p.hasConflict).length;

  return (
    <div className="h-screen w-screen flex flex-col bg-bg-base overflow-hidden">
      {/* ヘッダー */}
      <Header
        fileCount={files.length}
        changedCount={changedCount}
        canUndo={canUndoState}
        isExecuting={isExecuting}
        scanOptions={scanOptions}
        setScanOptions={setScanOptions}
        onClearFiles={clearFiles}
        onExecute={handleExecute}
        onUndo={handleUndo}
        onOpenPresets={() => setIsPresetModalOpen(true)}
        onOpenRegexHelp={() => setIsRegexModalOpen(true)}
      />

      {/* メインエリア（左: ルールサイドバー、スプリッター、右: プレビューテーブル） */}
      <div className="flex-1 flex overflow-hidden">
        <PipelineSidebar
          width={sidebarWidth}
          rules={rules}
          onAddRule={addRule}
          onUpdateRule={updateRule}
          onRemoveRule={removeRule}
          onToggleRule={toggleRule}
          onMoveRule={moveRule}
          wordHistory={wordHistory}
          onAddWord={addWord}
          onRemoveWord={removeWord}
        />

        {/* サイドバースプリッター */}
        <div
          onMouseDown={handleSidebarResizeStart}
          className="w-1 bg-slate-200/80 hover:bg-accent-primary cursor-col-resize flex-shrink-0 transition-colors z-10"
          title="ドラッグしてサイドバー幅を変更"
        />

        <main className="flex-1 h-full overflow-hidden relative">
          {files.length === 0 ? (
            <FileDropZone isDragging={isDragging} />
          ) : (
            <PreviewTable
              files={files}
              previews={previews}
              filterQuery={filterQuery}
              setFilterQuery={setFilterQuery}
              onToggleSelect={toggleSelect}
              onSelectAll={selectAll}
              onRemoveFiles={removeFiles}
              onUpdateFileCustomName={updateFileCustomName}
              columnWidths={columnWidths}
              setColumnWidths={setColumnWidths}
            />
          )}

          {/* ドラッグオーバー中オーバーレイ */}
          {isDragging && files.length > 0 && (
            <div className="absolute inset-0 bg-blue-50/80 backdrop-blur-xs border-2 border-dashed border-accent-primary z-30 flex items-center justify-center pointer-events-none">
              <div className="bg-white px-5 py-3 rounded-lg shadow-panel border border-slate-200 text-center font-bold text-xs text-accent-primary">
                ファイルまたはフォルダをドロップして追加
              </div>
            </div>
          )}
        </main>
      </div>

      {/* フッター */}
      <Footer
        totalFiles={files.length}
        selectedFiles={selectedCount}
        changedFiles={changedCount}
        conflictFiles={conflictCount}
      />

      {/* トースト通知 */}
      {toastMessage && (
        <div
          className={`fixed bottom-12 right-6 z-50 px-4 py-2.5 rounded-lg shadow-dropdown border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* プリセットモーダル */}
      <PresetModal
        isOpen={isPresetModalOpen}
        currentRules={rules}
        onClose={() => setIsPresetModalOpen(false)}
        onApplyPreset={(newRules) => setRules(newRules)}
      />

      {/* 正規表現ヘルプモーダル */}
      <RegexModal
        isOpen={isRegexModalOpen}
        onClose={() => setIsRegexModalOpen(false)}
      />
    </div>
  );
};

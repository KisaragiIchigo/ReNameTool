// リネームルールの型定義

export type RuleType =
  | 'replace'
  | 'remove_range'
  | 'sequence'
  | 'datetime'
  | 'add_text'
  | 'move_text'
  | 'case_transform'
  | 'folder_name'
  | 'extension';

export interface BaseRule {
  id: string;
  type: RuleType;
  enabled: boolean;
  name: string;
}

export interface ReplaceRule extends BaseRule {
  type: 'replace';
  find: string;
  replace: string;
  useRegex: boolean;
  matchCase: boolean;
  replaceAll: boolean;
  includeExtension: boolean;
}

export interface RemoveRangeRule extends BaseRule {
  type: 'remove_range';
  startChar: string;
  endChar: string;
  includeEnclosingChars: boolean;
}

export interface SequenceRule extends BaseRule {
  type: 'sequence';
  start: number;
  step: number;
  digits: number;
  position: 'prefix' | 'suffix' | 'full';
  separator: string;
  resetPerFolder: boolean;
}

export interface DateTimeRule extends BaseRule {
  type: 'datetime';
  source: 'created' | 'modified' | 'now';
  format: 'YYYYMMDD' | 'YYYY-MM-DD' | 'YYYY_MM_DD-HH_mm_ss' | 'YYYYMMDD_HHmmss' | 'custom';
  customFormat: string;
  position: 'prefix' | 'suffix' | 'full';
  separator: string;
}

export interface AddTextRule extends BaseRule {
  type: 'add_text';
  text: string;
  position: 'prefix' | 'suffix' | 'index';
  index?: number;
}

export interface MoveTextRule extends BaseRule {
  type: 'move_text';
  find: string;
  useRegex: boolean;
  action: 'move' | 'copy';
  targetPos: 'start' | 'end' | 'after_anchor';
  anchorText: string;
  anchorRegex: boolean;
  separator: '' | ' ' | '_' | '-';
  deleteAllFound: boolean;
}

export interface CaseTransformRule extends BaseRule {
  type: 'case_transform';
  target: 'all' | 'name_only' | 'ext_only';
  transform: 'uppercase' | 'lowercase' | 'titlecase' | 'snake_case' | 'kebab-case';
}

export interface FolderNameRule extends BaseRule {
  type: 'folder_name';
  position: 'prefix' | 'suffix';
  includeParent: boolean;
  separator: '_' | '-' | ' ';
}

export interface ExtensionRule extends BaseRule {
  type: 'extension';
  mode: 'lowercase' | 'uppercase' | 'custom';
  customExt: string;
}

export type RenameRule =
  | ReplaceRule
  | RemoveRangeRule
  | SequenceRule
  | DateTimeRule
  | AddTextRule
  | MoveTextRule
  | CaseTransformRule
  | FolderNameRule
  | ExtensionRule;

export interface FileItem {
  id: string;
  originalPath: string;
  originalName: string;
  originalExt: string;
  originalDir: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
  isDirectory: boolean;
  selected: boolean;
  customOverrideName?: string;
}

export interface ColumnWidths {
  status: number;
  original: number;
  preview: number;
  folder: number;
  size: number;
  actions: number;
}

export interface DiffPart {
  type: 'same' | 'added' | 'removed';
  value: string;
}

export interface PreviewItem {
  id: string;
  fileItem: FileItem;
  originalName: string;
  originalExt: string;
  originalFullName: string;
  newName: string;
  newExt: string;
  newFullName: string;
  targetPath: string;
  isChanged: boolean;
  hasConflict: boolean;
  conflictReason?: string;
  diffParts: DiffPart[];
  error?: string;
}

export interface RenameExecutionResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  historyId?: string;
  errors: { path: string; error: string }[];
  renamedPairs?: { fromPath: string; toPath: string }[];
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  items: {
    fromPath: string;
    toPath: string;
  }[];
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  rules: RenameRule[];
}

export type WordHistoryCategory =
  | 'find'
  | 'replace'
  | 'surrounded_start'
  | 'surrounded_end'
  | 'add_text'
  | 'move_find'
  | 'move_anchor'
  | 'extension'
  | 'general';

export type WordHistoryMap = Record<string, string[]>;

export interface ScanOptions {
  includeSubfolders: boolean;
  targetScope: 'files' | 'folders' | 'both';
}

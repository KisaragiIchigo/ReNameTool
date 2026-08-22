import {
  FileItem,
  PreviewItem,
  RenameRule,
  ReplaceRule,
  RemoveRangeRule,
  SequenceRule,
  DateTimeRule,
  AddTextRule,
  MoveTextRule,
  CaseTransformRule,
  FolderNameRule,
  ExtensionRule,
} from '../types';
import { computeDiff } from './diffHelper';

/**
 * 日付フォーマットヘルパー
 */
function formatDate(timestamp: number, formatStr: string, customFormat?: string): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');

  const YYYY = String(d.getFullYear());
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());

  if (formatStr === 'YYYYMMDD') return `${YYYY}${MM}${DD}`;
  if (formatStr === 'YYYY-MM-DD') return `${YYYY}-${MM}-${DD}`;
  if (formatStr === 'YYYY_MM_DD-HH_mm_ss') return `${YYYY}_${MM}_${DD}-${HH}_${mm}_${ss}`;
  if (formatStr === 'YYYYMMDD_HHmmss') return `${YYYY}${MM}${DD}_${HH}${mm}${ss}`;

  if (formatStr === 'custom' && customFormat) {
    return customFormat
      .replace(/YYYY/g, YYYY)
      .replace(/MM/g, MM)
      .replace(/DD/g, DD)
      .replace(/HH/g, HH)
      .replace(/mm/g, mm)
      .replace(/ss/g, ss);
  }

  return `${YYYY}${MM}${DD}`;
}

/**
 * 連続するセパレータの整理 (例: "__" -> "_", "  " -> " ")
 */
function cleanSeparators(text: string): string {
  return text
    .replace(/_{2,}/g, '_')
    .replace(/\s{2,}/g, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/^[_\s-]+|[_\s-]+$/g, '');
}

/**
 * 各個別ルールの適用
 */
export function applyRule(
  currentName: string,
  currentExt: string,
  rule: RenameRule,
  fileItem: FileItem,
  counter: number
): { name: string; ext: string } {
  if (!rule.enabled) {
    return { name: currentName, ext: currentExt };
  }

  let name = currentName;
  let ext = currentExt;

  switch (rule.type) {
    case 'replace': {
      const r = rule as ReplaceRule;
      if (!r.find) break;

      try {
        let flags = r.replaceAll ? 'g' : '';
        if (!r.matchCase) flags += 'i';

        if (r.includeExtension) {
          const full = `${name}${ext ? '.' + ext : ''}`;
          let replaced = full;
          if (r.useRegex) {
            const regex = new RegExp(r.find, flags);
            replaced = full.replace(regex, r.replace);
          } else {
            if (r.replaceAll) {
              const regex = new RegExp(r.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
              replaced = full.replace(regex, r.replace);
            } else {
              replaced = full.replace(r.find, r.replace);
            }
          }
          // 分離
          const lastDot = replaced.lastIndexOf('.');
          if (lastDot !== -1 && !fileItem.isDirectory) {
            name = replaced.substring(0, lastDot);
            ext = replaced.substring(lastDot + 1);
          } else {
            name = replaced;
            ext = '';
          }
        } else {
          if (r.useRegex) {
            const regex = new RegExp(r.find, flags);
            name = name.replace(regex, r.replace);
          } else {
            if (r.replaceAll) {
              const regex = new RegExp(r.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
              name = name.replace(regex, r.replace);
            } else {
              name = name.replace(r.find, r.replace);
            }
          }
        }
      } catch {
        // 正規表現エラー時はスキップ
      }
      break;
    }

    case 'remove_range': {
      const r = rule as RemoveRangeRule;
      if (!r.startChar) break;

      const startIndex = name.indexOf(r.startChar);
      if (startIndex !== -1) {
        if (r.endChar) {
          const endIndex = name.indexOf(r.endChar, startIndex + r.startChar.length);
          if (endIndex !== -1) {
            if (r.includeEnclosingChars) {
              name = name.substring(0, startIndex) + name.substring(endIndex + r.endChar.length);
            } else {
              name = name.substring(0, startIndex + r.startChar.length) + name.substring(endIndex);
            }
          }
        } else {
          // 終了文字なしなら開始文字から末尾まで削除
          name = name.substring(0, startIndex);
        }
      }
      break;
    }

    case 'sequence': {
      const r = rule as SequenceRule;
      const digits = Math.max(1, r.digits || 1);
      const seqStr = String(counter).padStart(digits, '0');
      const sep = r.separator || '';

      if (r.position === 'full') {
        name = seqStr;
      } else if (r.position === 'prefix') {
        name = `${seqStr}${sep}${name}`;
      } else if (r.position === 'suffix') {
        name = `${name}${sep}${seqStr}`;
      }
      break;
    }

    case 'datetime': {
      const r = rule as DateTimeRule;
      let ts = fileItem.modifiedAt;
      if (r.source === 'created') ts = fileItem.createdAt;
      else if (r.source === 'now') ts = Date.now();

      const dateStr = formatDate(ts, r.format, r.customFormat);
      const sep = r.separator || '';

      if (r.position === 'full') {
        name = dateStr;
      } else if (r.position === 'prefix') {
        name = `${dateStr}${sep}${name}`;
      } else if (r.position === 'suffix') {
        name = `${name}${sep}${dateStr}`;
      }
      break;
    }

    case 'add_text': {
      const r = rule as AddTextRule;
      if (!r.text) break;

      if (r.position === 'prefix') {
        name = `${r.text}${name}`;
      } else if (r.position === 'suffix') {
        name = `${name}${r.text}`;
      } else if (r.position === 'index' && typeof r.index === 'number') {
        const idx = Math.max(0, Math.min(name.length, r.index));
        name = name.substring(0, idx) + r.text + name.substring(idx);
      }
      break;
    }

    case 'move_text': {
      const r = rule as MoveTextRule;
      if (!r.find) break;

      try {
        let matchedText = '';
        let targetRegex: RegExp | null = null;

        if (r.useRegex) {
          targetRegex = new RegExp(r.find, r.deleteAllFound ? 'g' : '');
          const m = name.match(targetRegex);
          if (m) matchedText = m[0];
        } else {
          if (name.includes(r.find)) {
            matchedText = r.find;
          }
        }

        if (!matchedText) break;

        let baseName = name;
        if (r.action === 'move') {
          if (r.useRegex && targetRegex) {
            baseName = baseName.replace(targetRegex, '');
          } else {
            baseName = r.deleteAllFound
              ? baseName.split(r.find).join('')
              : baseName.replace(r.find, '');
          }
        }

        const sep = r.separator || '';

        if (r.targetPos === 'start') {
          name = baseName ? `${matchedText}${sep}${baseName}` : matchedText;
        } else if (r.targetPos === 'end') {
          name = baseName ? `${baseName}${sep}${matchedText}` : matchedText;
        } else if (r.targetPos === 'after_anchor' && r.anchorText) {
          let anchorIdx = -1;
          let anchorLen = 0;

          if (r.anchorRegex) {
            const am = baseName.match(new RegExp(r.anchorText));
            if (am && am.index !== undefined) {
              anchorIdx = am.index;
              anchorLen = am[0].length;
            }
          } else {
            anchorIdx = baseName.indexOf(r.anchorText);
            anchorLen = r.anchorText.length;
          }

          if (anchorIdx !== -1) {
            const insertAt = anchorIdx + anchorLen;
            const left = baseName.substring(0, insertAt);
            const right = baseName.substring(insertAt);
            name = `${left}${sep}${matchedText}${right}`;
          }
        }

        name = cleanSeparators(name);
      } catch {
        // 正規表現エラー無視
      }
      break;
    }

    case 'case_transform': {
      const r = rule as CaseTransformRule;
      const transformString = (s: string) => {
        switch (r.transform) {
          case 'uppercase':
            return s.toUpperCase();
          case 'lowercase':
            return s.toLowerCase();
          case 'titlecase':
            return s.replace(/\b\w/g, (char) => char.toUpperCase());
          case 'snake_case':
            return s
              .replace(/\s+/g, '_')
              .replace(/-+/g, '_')
              .toLowerCase();
          case 'kebab-case':
            return s
              .replace(/\s+/g, '-')
              .replace(/_+/g, '-')
              .toLowerCase();
          default:
            return s;
        }
      };

      if (r.target === 'all' || r.target === 'name_only') {
        name = transformString(name);
      }
      if (r.target === 'all' || r.target === 'ext_only') {
        ext = transformString(ext);
      }
      break;
    }

    case 'folder_name': {
      const r = rule as FolderNameRule;
      const parts = fileItem.originalDir.replace(/\\/g, '/').split('/').filter(Boolean);
      if (parts.length === 0) break;

      const folderName = parts[parts.length - 1];
      const parentName = parts.length > 1 ? parts[parts.length - 2] : '';
      const prefix = r.includeParent && parentName ? `${parentName}_${folderName}` : folderName;
      const sep = r.separator || '_';

      if (r.position === 'prefix') {
        name = `${prefix}${sep}${name}`;
      } else {
        name = `${name}${sep}${prefix}`;
      }
      break;
    }

    case 'extension': {
      const r = rule as ExtensionRule;
      if (r.mode === 'lowercase') ext = ext.toLowerCase();
      else if (r.mode === 'uppercase') ext = ext.toUpperCase();
      else if (r.mode === 'custom') ext = r.customExt.replace(/^\./, '');
      break;
    }
  }

  return { name, ext };
}

/**
 * 全ファイルへパイプラインを実行してプレビューアイテム一覧を生成
 */
export function generatePreviews(
  fileItems: FileItem[],
  rules: RenameRule[]
): PreviewItem[] {
  const dirCounters: Record<string, number> = {};
  const previewDrafts: {
    fileItem: FileItem;
    originalFullName: string;
    newBaseName: string;
    newExt: string;
    newFullName: string;
  }[] = [];

  // 各ファイルの基本変換
  for (const item of fileItems) {
    const dir = item.originalDir;
    const seqRule = rules.find((r) => r.type === 'sequence' && r.enabled) as SequenceRule | undefined;
    const startVal = seqRule ? seqRule.start || 1 : 1;
    const stepVal = seqRule ? seqRule.step || 1 : 1;

    let currentCounter = 1;
    if (seqRule?.resetPerFolder) {
      if (dirCounters[dir] === undefined) {
        dirCounters[dir] = startVal;
      } else {
        dirCounters[dir] += stepVal;
      }
      currentCounter = dirCounters[dir];
    } else {
      if (dirCounters['__global__'] === undefined) {
        dirCounters['__global__'] = startVal;
      } else {
        dirCounters['__global__'] += stepVal;
      }
      currentCounter = dirCounters['__global__'];
    }

    let currentName = item.originalName;
    let currentExt = item.originalExt;

    // 手動修正（customOverrideName）があればそれをベース名として採用
    if (item.customOverrideName !== undefined && item.customOverrideName.trim() !== '') {
      const override = item.customOverrideName.trim();
      const lastDot = override.lastIndexOf('.');
      if (lastDot !== -1 && !item.isDirectory) {
        currentName = override.substring(0, lastDot);
        currentExt = override.substring(lastDot + 1);
      } else {
        currentName = override;
      }
    }

    // 手動修正されたファイルも含めて、パイプラインの全ルールを一括適用！
    for (const rule of rules) {
      const result = applyRule(currentName, currentExt, rule, item, currentCounter);
      currentName = result.name;
      currentExt = result.ext;
    }

    const originalFullName = item.originalExt ? `${item.originalName}.${item.originalExt}` : item.originalName;
    const newFullName = currentExt ? `${currentName}.${currentExt}` : currentName;

    previewDrafts.push({
      fileItem: item,
      originalFullName,
      newBaseName: currentName,
      newExt: currentExt,
      newFullName,
    });
  }

  // 重複検出 & [重複001] 自動付与
  const finalDirUsedNames: Record<string, Set<string>> = {};
  const results: PreviewItem[] = [];

  for (const draft of previewDrafts) {
    const dir = draft.fileItem.originalDir;
    if (!finalDirUsedNames[dir]) {
      finalDirUsedNames[dir] = new Set<string>();
    }

    let candidateName = draft.newFullName;
    let hasConflict = false;
    let conflictReason: string | undefined;

    // ファイル名に使用できない禁止文字チェック (Windows: \ / : * ? " < > |)
    const invalidCharMatch = candidateName.match(/[\\/:*?"<>|]/);
    if (invalidCharMatch) {
      hasConflict = true;
      conflictReason = `使用禁止文字が含まれています: ${invalidCharMatch[0]}`;
    }

    if (finalDirUsedNames[dir].has(candidateName.toLowerCase())) {
      hasConflict = true;
      conflictReason = '同一フォルダ内に名前の重複があります（[重複001]を自動付与）';
      let duplicateIdx = 1;
      while (
        finalDirUsedNames[dir].has(
          `${draft.newBaseName}[重複${String(duplicateIdx).padStart(3, '0')}]${
            draft.newExt ? '.' + draft.newExt : ''
          }`.toLowerCase()
        )
      ) {
        duplicateIdx++;
      }
      candidateName = `${draft.newBaseName}[重複${String(duplicateIdx).padStart(3, '0')}]${
        draft.newExt ? '.' + draft.newExt : ''
      }`;
    }

    finalDirUsedNames[dir].add(candidateName.toLowerCase());

    const isChanged = draft.originalFullName !== candidateName;
    const diffParts = computeDiff(draft.originalFullName, candidateName);

    const targetPath = `${dir}\\${candidateName}`;

    results.push({
      id: draft.fileItem.id,
      fileItem: draft.fileItem,
      originalName: draft.fileItem.originalName,
      originalExt: draft.fileItem.originalExt,
      originalFullName: draft.originalFullName,
      newName: draft.newBaseName,
      newExt: draft.newExt,
      newFullName: candidateName,
      targetPath,
      isChanged,
      hasConflict,
      conflictReason,
      diffParts,
    });
  }

  return results;
}

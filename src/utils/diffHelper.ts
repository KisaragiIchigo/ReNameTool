import diff from 'fast-diff';
import { DiffPart } from '../types';

export function computeDiff(original: string, modified: string): DiffPart[] {
  if (original === modified) {
    return [{ type: 'same', value: original }];
  }

  const rawDiff = diff(original, modified);
  const parts: DiffPart[] = [];

  for (const [operation, text] of rawDiff) {
    if (operation === diff.EQUAL) {
      parts.push({ type: 'same', value: text });
    } else if (operation === diff.INSERT) {
      parts.push({ type: 'added', value: text });
    } else if (operation === diff.DELETE) {
      parts.push({ type: 'removed', value: text });
    }
  }

  return parts;
}

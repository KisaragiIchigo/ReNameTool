import React from 'react';
import { DiffPart } from '../../types';

interface Props {
  parts: DiffPart[];
  isChanged: boolean;
}

export const DiffView: React.FC<Props> = ({ parts, isChanged }) => {
  if (!isChanged) {
    return <span className="text-text-muted font-mono text-xs">{parts.map((p) => p.value).join('')}</span>;
  }

  return (
    <span className="font-mono text-xs inline-flex flex-wrap items-center gap-0.5">
      {parts.map((part, i) => {
        if (part.type === 'same') {
          return (
            <span key={i} className="text-text-primary">
              {part.value}
            </span>
          );
        }
        if (part.type === 'added') {
          return (
            <span
              key={i}
              className="bg-status-diff-add-bg text-status-diff-add font-semibold px-1 py-0.2 rounded border border-green-200"
              title="追加・変更箇所"
            >
              {part.value}
            </span>
          );
        }
        if (part.type === 'removed') {
          return (
            <span
              key={i}
              className="bg-status-diff-del-bg text-status-diff-del line-through font-normal px-1 py-0.2 rounded border border-red-200"
              title="削除箇所"
            >
              {part.value}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export function naturalCompare(a: string, b: string): number {
  return collator.compare(a, b);
}

export function sortFilePaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => collator.compare(a, b));
}

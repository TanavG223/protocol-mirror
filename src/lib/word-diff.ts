/**
 * Word-level diff between two short quotations, used to show a reviewer exactly which words
 * differ between a registered outcome and a reported statement. Longest-common-subsequence over
 * whitespace tokens; punctuation stays attached to its word so quotes are never altered.
 */
export type DiffPart = { text: string; kind: "same" | "left" | "right" };

export const DIFF_WORD_LIMIT = 80;

export function wordDiff(left: string, right: string): DiffPart[] {
  const a = left.split(/\s+/).filter(Boolean);
  const b = right.split(/\s+/).filter(Boolean);
  const normalize = (word: string) => word.toLowerCase().replace(/[^\p{L}\p{N}%.<>=-]/gu, "");
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = normalize(a[i]) === normalize(b[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (text: string, kind: DiffPart["kind"]) => {
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.text += ` ${text}`;
    else parts.push({ text, kind });
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (normalize(a[i]) === normalize(b[j])) { push(a[i], "same"); i += 1; j += 1; }
    else if (table[i + 1][j] >= table[i][j + 1]) { push(a[i], "left"); i += 1; }
    else { push(b[j], "right"); j += 1; }
  }
  while (i < a.length) { push(a[i], "left"); i += 1; }
  while (j < b.length) { push(b[j], "right"); j += 1; }
  return parts;
}

/** True when both quotations are short enough for a word diff to be readable. */
export const diffIsReadable = (left: string, right: string) =>
  left.split(/\s+/).filter(Boolean).length <= DIFF_WORD_LIMIT && right.split(/\s+/).filter(Boolean).length <= DIFF_WORD_LIMIT;

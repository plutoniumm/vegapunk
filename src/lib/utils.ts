export function processWord (word: string) {
  if (!word)
    return { left: "", pivot: "", right: "" };

  const len = word.length;
  let pivot = 0;

  if (len === 1) pivot = 0;
  else if (len >= 2 && len <= 5) pivot = 1;
  else if (len >= 6 && len <= 9) pivot = 2;
  else if (len >= 10 && len <= 13) pivot = 3;
  else pivot = 4;

  if (pivot >= len)
    pivot = Math.floor((len - 1) / 2);

  return {
    left: word.slice(0, pivot),
    pivot: word[pivot],
    right: word.slice(pivot + 1),
  };
}

export function percent (text: string, index: number): number {
  if (!text) return 0;
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  if (wordCount === 0) return 0;

  let percent = Math.round((index / wordCount) * 1000);
  percent /= 10;
  percent = percent > 100 ? 100 : percent

  return Number(percent.toFixed(1));
}

export function fmt (ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const B = 1_000_000_000;
const M = 1_000_000;
const K = 1_000;

export function O (num: number): string {
  if (num < 0) num = 0;

  if (num >= B)
    return (num / B).toFixed(1).replace(/\.0$/, '') + 'B';
  if (num >= M)
    return (num / M).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= K)
    return (num / K).toFixed(1).replace(/\.0$/, '') + 'K';

  return num.toString();
}

export const counter = (text: string) => {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
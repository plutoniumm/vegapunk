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

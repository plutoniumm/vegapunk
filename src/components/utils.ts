export const escape = (s) =>
  encodeURIComponent(s.replaceAll(" ", "-").toLowerCase());

export const hash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) + h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16);
};
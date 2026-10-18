// ---------- 暗号の計算 ----------

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 1文字を key 文字ぶん後ろにずらす（Z の次は A に戻る）。英字以外はそのまま */
export function shiftChar(ch: string, key: number) {
  const i = ALPHABET.indexOf(ch);
  if (i < 0) return ch;
  return ALPHABET[(((i + key) % 26) + 26) % 26];
}

/** シーザー暗号で暗号化する */
export function encrypt(text: string, key: number) {
  return [...text].map((c) => shiftChar(c, key)).join("");
}

/** シーザー暗号で復号する（暗号化と同じ鍵で、反対向きにずらす） */
export function decrypt(text: string, key: number) {
  return encrypt(text, -key);
}

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

/** 文字を 8 ビットの 0/1 に直す */
export function toBits(ch: string) {
  return ch
    .charCodeAt(0)
    .toString(2)
    .padStart(8, "0")
    .split("")
    .map(Number);
}

export function xorBits(a: number[], b: number[]) {
  return a.map((v, i) => v ^ b[i]);
}

// ---------- 大きな数を日本語で表す ----------

const UNITS: [number, string][] = [
  [20, "垓"],
  [16, "京"],
  [12, "兆"],
  [8, "億"],
  [4, "万"],
];

/** 10 の何乗かで表した数（log10）を、日本語の読みやすい形にする */
export function formatLog10(log: number) {
  if (log < 4) return Math.round(10 ** log).toLocaleString("ja-JP");
  if (log < 24) {
    const [exp, unit] = UNITS.find(([e]) => log >= e)!;
    const v = 10 ** (log - exp);
    return `約 ${v >= 100 ? Math.round(v) : Number(v.toPrecision(2))}${unit}`;
  }
  const exp = Math.floor(log);
  const mant = 10 ** (log - exp);
  return `約 ${mant.toFixed(1)} × 10^${exp}`;
}

const SECONDS: [number, string][] = [
  [365 * 24 * 3600, "年"],
  [24 * 3600, "日"],
  [3600, "時間"],
  [60, "分"],
  [1, "秒"],
];

/** かかる秒数（log10）を、日本語の読みやすい時間にする */
export function formatDuration(logSec: number) {
  if (logSec < -3) return "一瞬（0.001 秒未満）";
  const sec = 10 ** logSec;
  if (sec < 1) return `約 ${Number(sec.toPrecision(2))} 秒`;
  for (const [unit, name] of SECONDS) {
    if (sec >= unit) {
      const log = logSec - Math.log10(unit);
      return log < 4 ? `約 ${Math.round(10 ** log).toLocaleString("ja-JP")} ${name}` : `${formatLog10(log)} ${name}`;
    }
  }
  return "";
}

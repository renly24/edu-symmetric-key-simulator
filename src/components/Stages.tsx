"use client";
import { type CSSProperties, Fragment, type ReactNode, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ALPHABET, decrypt, encrypt, formatDuration, formatLog10, shiftChar, toBits, xorBits } from "@/lib/cipher";
import { BRUTE_CIPHER, BRUTE_KEY, CIPHER_COLOR, EVE_COLOR, KEY_COLOR, PLAIN_COLOR } from "@/lib/model";
import { Feedback } from "./Quizzes";

// ---------- 共通部品 ----------

/** 平文・暗号文・鍵を色分けした札 */
function Tag({ kind, children, big }: { kind: "plain" | "cipher" | "key"; children: ReactNode; big?: boolean }) {
  const color = kind === "plain" ? PLAIN_COLOR : kind === "cipher" ? CIPHER_COLOR : KEY_COLOR;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        border: `2.5px solid ${color}`,
        color,
        bgcolor: "#fff",
        borderRadius: 1.5,
        px: big ? 1.5 : 0.75,
        py: big ? 0.5 : 0.1,
        fontFamily: kind === "key" ? undefined : "monospace",
        fontWeight: 700,
        fontSize: big ? "1.4rem" : "0.95rem",
        letterSpacing: kind === "key" ? 0 : "0.12em",
      }}
    >
      {children}
    </Box>
  );
}

/** 10^n の「^n」を上付き文字にする */
function Num({ text }: { text: string }) {
  const [base, exp] = text.split("^");
  return (
    <>
      {base}
      {exp && <sup>{exp}</sup>}
    </>
  );
}

function KeySlider({ value, onChange, label, min = 1, max = 25 }: { value: number; onChange: (v: number) => void; label: string; min?: number; max?: number }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 1 }}>
      <Typography fontWeight={700} sx={{ whiteSpace: "nowrap", color: KEY_COLOR }}>
        🔑 {label}：{value}
      </Typography>
      <Slider
        value={value}
        min={min}
        max={max}
        step={1}
        marks
        onChange={(_, v) => onChange(v as number)}
        aria-label={label}
        sx={{ color: KEY_COLOR }}
      />
    </Stack>
  );
}

// ---------- 第1章：暗号のことば ----------

function Arrow({ label }: { label: string }) {
  return (
    <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 88 }}>
      <Tag kind="key">🔑 鍵</Tag>
      <Typography fontWeight={700} sx={{ fontSize: "0.85rem" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.6rem", lineHeight: 1, color: "#78909c", transform: { xs: "rotate(90deg)", sm: "none" } }}>➜</Typography>
    </Stack>
  );
}

export function TermsStage() {
  const box = (title: string, sub: string, kind: "plain" | "cipher", text: string) => (
    <Stack alignItems="center" spacing={0.5} sx={{ p: 1.5, borderRadius: 3, bgcolor: "#f5f7fa", minWidth: 120 }}>
      <Typography fontWeight={700}>{title}</Typography>
      <Tag kind={kind} big>
        {text}
      </Tag>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {sub}
      </Typography>
    </Stack>
  );
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" spacing={1}>
        {box("平文", "だれでも読める", "plain", "SUSHI")}
        <Arrow label="暗号化" />
        {box("暗号文", "鍵がないと読めない", "cipher", "VXVKL")}
        <Arrow label="復号" />
        {box("平文", "元に戻った", "plain", "SUSHI")}
      </Stack>
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
        <Typography variant="body2" fontWeight={700}>
          👩 送る人がすること：暗号化
        </Typography>
        <Typography color="text.secondary">／</Typography>
        <Typography variant="body2" fontWeight={700}>
          🧑 受け取る人がすること：復号
        </Typography>
      </Stack>
    </Stack>
  );
}

// ---------- 第2章：文字をずらす（シーザー暗号） ----------

/** 平文の段と暗号文の段を並べた表 */
function AlphabetStrip({ shift, mark }: { shift: number; mark?: { row: "plain" | "cipher"; col: number } }) {
  const rows = [
    { name: "平文", kind: "plain" as const, color: PLAIN_COLOR, letter: (i: number) => ALPHABET[i] },
    { name: "暗号文", kind: "cipher" as const, color: CIPHER_COLOR, letter: (i: number) => shiftChar(ALPHABET[i], shift) },
  ];
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "auto repeat(26, minmax(0, 1fr))", gap: { xs: "1px", sm: "2px" } }}>
        {rows.map((r) => (
          <Fragment key={r.name}>
            <Typography sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem" }, fontWeight: 700, color: r.color, pr: 0.5, alignSelf: "center", whiteSpace: "nowrap" }}>{r.name}</Typography>
            {ALPHABET.split("").map((_, i) => {
              const on = mark?.col === i;
              const strong = on && mark?.row === r.kind;
              return (
                <Box
                  key={i}
                  sx={{
                    textAlign: "center",
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: { xs: "0.62rem", sm: "0.85rem" },
                    py: 0.4,
                    borderRadius: 0.5,
                    border: { xs: `1px solid ${r.color}`, sm: `1.5px solid ${r.color}` },
                    bgcolor: strong ? "#fff176" : on ? "#fffde7" : "#fff",
                    color: r.color,
                    transform: strong ? "scale(1.15)" : "none",
                    transition: "background-color 0.2s, transform 0.2s",
                  }}
                >
                  {r.letter(i)}
                </Box>
              );
            })}
          </Fragment>
        ))}
    </Box>
  );
}

export function CaesarStage() {
  const [key, setKey] = useState(3);
  const [col, setCol] = useState(0);
  return (
    <Stack spacing={2}>
      <KeySlider value={key} onChange={setKey} label="ずらす数（鍵）" />
      <AlphabetStrip shift={key} mark={{ row: "plain", col }} />
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap justifyContent="center">
        {ALPHABET.split("").map((c, i) => (
          <Button
            key={c}
            size="small"
            variant={i === col ? "contained" : "outlined"}
            onClick={() => setCol(i)}
            sx={{ minWidth: 30, px: 0, fontFamily: "monospace", fontWeight: 700 }}
            aria-label={`${c} を選ぶ`}
          >
            {c}
          </Button>
        ))}
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
        <Tag kind="plain" big>
          {ALPHABET[col]}
        </Tag>
        <Typography fontWeight={700} sx={{ color: KEY_COLOR }}>
          ➜ {key} つ後ろへ ➜
        </Typography>
        <Tag kind="cipher" big>
          {shiftChar(ALPHABET[col], key)}
        </Tag>
      </Stack>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        文字のボタンを押すと、その文字がどこに移るか見られます。X・Y・Z で試すと、A に戻るのが分かります。
      </Typography>
    </Stack>
  );
}

// ---------- 第2章：手で暗号化・復号する ----------

export function Handwork({ mode, text, keyValue }: { mode: "encrypt" | "decrypt"; text: string; keyValue: number }) {
  const answer = mode === "encrypt" ? encrypt(text, keyValue) : decrypt(text, keyValue);
  const [values, setValues] = useState<string[]>(() => text.split("").map(() => ""));
  const [focus, setFocus] = useState<number | null>(0);
  const [checked, setChecked] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const correct = values.filter((v, i) => v === answer[i]).length;

  // 選んでいる欄の、探す文字の位置
  let mark: { row: "plain" | "cipher"; col: number } | undefined;
  if (focus !== null) {
    const src = ALPHABET.indexOf(text[focus]);
    mark = mode === "encrypt" ? { row: "plain", col: src } : { row: "cipher", col: (src - keyValue + 26) % 26 };
  }

  const set = (i: number, raw: string) => {
    const ch = raw.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    const next = [...values];
    next[i] = ch;
    setValues(next);
    setChecked(false);
    if (ch && i < text.length - 1) inputs.current[i + 1]?.focus();
  };

  const from = mode === "encrypt" ? "plain" : "cipher";
  const to = mode === "encrypt" ? "cipher" : "plain";

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" flexWrap="wrap" useFlexGap>
        <Tag kind={from} big>
          {text}
        </Tag>
        <Typography fontWeight={700} sx={{ color: KEY_COLOR }}>
          ➜ 🔑 鍵 {keyValue} で{mode === "encrypt" ? "暗号化" : "復号"} ➜
        </Typography>
        <Typography fontWeight={700}>？</Typography>
      </Stack>
      <AlphabetStrip shift={keyValue} mark={mark} />
      <Stack direction="row" spacing={1} justifyContent="center">
        {text.split("").map((c, i) => {
          const state = checked ? (values[i] === answer[i] ? "ok" : "ng") : undefined;
          return (
            <Stack key={i} alignItems="center" spacing={0.5}>
              <Tag kind={from}>{c}</Tag>
              <Typography sx={{ lineHeight: 1, color: "#90a4ae" }}>↓</Typography>
              <TextField
                value={values[i]}
                onChange={(e) => set(i, e.target.value)}
                onFocus={() => setFocus(i)}
                inputRef={(el) => {
                  inputs.current[i] = el;
                }}
                autoComplete="off"
                slotProps={{
                  htmlInput: {
                    "aria-label": `${i + 1}文字目`,
                    autoCapitalize: "characters",
                    style: { textAlign: "center", fontFamily: "monospace", fontWeight: 700, fontSize: "1.3rem", padding: "6px 0", width: 40 },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: state === "ok" ? "#e8f5e9" : state === "ng" ? "#ffebee" : "#fff",
                    "& fieldset": { borderWidth: 2, borderColor: state === "ok" ? "success.main" : state === "ng" ? "error.main" : to === "cipher" ? CIPHER_COLOR : PLAIN_COLOR },
                  },
                }}
              />
            </Stack>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" disabled={values.some((v) => !v)} onClick={() => setChecked(true)}>
          答え合わせ
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setValues(text.split("").map(() => ""));
            setChecked(false);
            inputs.current[0]?.focus();
          }}
        >
          消す
        </Button>
      </Stack>
      {checked &&
        (correct === text.length ? (
          <Feedback ok>
            正解！ 「{text}」を鍵 {keyValue} で{mode === "encrypt" ? "暗号化" : "復号"}すると「{answer}」です。
            {mode === "encrypt" ? "このままでは、鍵を知らない人には何のことか分かりません。" : "暗号化と同じ鍵を使ったので、元の平文に戻せました。"}
          </Feedback>
        ) : (
          <Feedback ok={false}>
            {correct} / {text.length} 文字正解。赤い欄を選ぶと、表のどこを見ればよいかが光ります。
            {mode === "decrypt" && "復号では、下の段（暗号文）から探して、上の段（平文）を読みます。"}
          </Feedback>
        ))}
    </Stack>
  );
}

// ---------- 第2章：違う鍵で復号する ----------

const WRONG_CIPHER = "VXVKL";
const WRONG_RIGHT_KEY = 3;

export function WrongKeyStage() {
  const [key, setKey] = useState(5);
  const plain = decrypt(WRONG_CIPHER, key);
  const ok = key === WRONG_RIGHT_KEY;
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <Typography fontWeight={700}>届いた暗号文</Typography>
        <Tag kind="cipher" big>
          {WRONG_CIPHER}
        </Tag>
      </Stack>
      <KeySlider value={key} onChange={setKey} label="復号に使う鍵" />
      <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderWidth: 2, borderColor: ok ? "success.main" : "#cfd8dc", bgcolor: ok ? "#f1f8e9" : "#fafafa" }}>
        <Typography variant="caption" color="text.secondary">
          鍵 {key} で復号した結果
        </Typography>
        <Stack direction="row" spacing={0.75} justifyContent="center" my={1}>
          {plain.split("").map((c, i) => (
            <Box
              key={`${key}-${i}`}
              className="seq-anim"
              sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "2rem", color: ok ? PLAIN_COLOR : "#90a4ae", width: 36 }}
            >
              <span className="pop" style={{ "--delay": `${i * 0.05}s` } as CSSProperties}>
                {c}
              </span>
            </Box>
          ))}
        </Stack>
        <Typography fontWeight={700} color={ok ? "success.main" : "text.secondary"}>
          {ok ? "⭕ 意味のある言葉（SUSHI）に戻った！ 暗号化と同じ鍵です" : "❌ 意味のない文字の並び。読めません"}
        </Typography>
      </Paper>
    </Stack>
  );
}

// ---------- 第3章：総当たり ----------

export function BruteForce() {
  const [tried, setTried] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const found = picked === BRUTE_KEY;
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <Typography fontWeight={700}>🕵️ コピーした暗号文</Typography>
        <Tag kind="cipher" big>
          {BRUTE_CIPHER}
        </Tag>
      </Stack>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button variant="contained" disabled={tried >= 25} onClick={() => setTried(tried + 1)}>
          次の鍵を試す（鍵 {Math.min(tried + 1, 25)}）
        </Button>
        <Button variant="outlined" disabled={tried >= 25} onClick={() => setTried(25)}>
          残りを全部試す
        </Button>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }, gap: 0.5 }}>
        {Array.from({ length: tried }, (_, i) => i + 1).map((k) => {
          const state = picked === k ? (k === BRUTE_KEY ? "ok" : "ng") : undefined;
          return (
            <Button
              key={k}
              size="small"
              variant="outlined"
              color={state === "ok" ? "success" : state === "ng" ? "error" : "inherit"}
              onClick={() => setPicked(k)}
              disabled={found}
              sx={{
                justifyContent: "space-between",
                fontFamily: "monospace",
                fontWeight: 700,
                bgcolor: state === "ok" ? "#e8f5e9" : state === "ng" ? "#ffebee" : "#fff",
                "&.Mui-disabled": { color: state === "ok" ? PLAIN_COLOR : undefined },
              }}
            >
              <Box component="span" sx={{ color: KEY_COLOR, fontFamily: "Roboto, sans-serif", fontSize: "0.75rem" }}>
                鍵{k}
              </Box>
              {decrypt(BRUTE_CIPHER, k)}
            </Button>
          );
        })}
      </Box>
      {tried === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          「次の鍵を試す」を押すと、その鍵で復号した結果が並びます。
        </Typography>
      )}
      {picked !== null &&
        (found ? (
          <Feedback ok>
            解読成功！ 鍵 {BRUTE_KEY} で「SAKURA」になりました。シーザー暗号は鍵が 25 通りしかないので、全部試してもすぐに解読できてしまいます。
          </Feedback>
        ) : (
          <Feedback ok={false}>鍵 {picked} の結果は意味のある言葉ではありません。ほかの行も探してみよう。</Feedback>
        ))}
    </Stack>
  );
}

// ---------- 第3章：ビットで暗号化する（XOR） ----------

const XOR_LETTERS = ["S", "U", "H", "I"];

function BitRow({ label, bits, color, onToggle }: { label: ReactNode; bits: number[]; color: string; onToggle?: (i: number) => void }) {
  return (
    <>
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color, alignSelf: "center", whiteSpace: "nowrap", pr: 0.5 }}>{label}</Typography>
      {bits.map((b, i) => (
        <Box
          key={i}
          component={onToggle ? "button" : "div"}
          type={onToggle ? "button" : undefined}
          onClick={onToggle ? () => onToggle(i) : undefined}
          aria-label={onToggle ? `鍵の ${i + 1} ビット目（今は ${b}）` : undefined}
          sx={{
            border: `2px solid ${color}`,
            borderRadius: 1,
            bgcolor: b ? color : "#fff",
            color: b ? "#fff" : color,
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: "1.05rem",
            py: 0.4,
            textAlign: "center",
            cursor: onToggle ? "pointer" : "default",
            transition: "background-color 0.2s",
            px: 0,
          }}
        >
          {b}
        </Box>
      ))}
    </>
  );
}

export function XorStage() {
  const [letter, setLetter] = useState("S");
  const [key, setKey] = useState([1, 0, 1, 1, 0, 1, 0, 0]);
  const plain = toBits(letter);
  const cipher = xorBits(plain, key);
  const back = xorBits(cipher, key);
  const toggle = (i: number) => setKey(key.map((b, j) => (j === i ? 1 - b : b)));
  const op = (
    <Typography sx={{ gridColumn: "1 / -1", textAlign: "center", fontWeight: 700, color: "#78909c", lineHeight: 1 }}>
      XOR（同じなら 0・違えば 1）↓
    </Typography>
  );
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <Typography variant="body2" fontWeight={700}>
          平文の文字：
        </Typography>
        {XOR_LETTERS.map((c) => (
          <Button key={c} size="small" variant={c === letter ? "contained" : "outlined"} onClick={() => setLetter(c)} sx={{ minWidth: 36, fontFamily: "monospace", fontWeight: 700 }}>
            {c}
          </Button>
        ))}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: "auto repeat(8, minmax(0, 1fr))", gap: 0.5, maxWidth: 460, width: "100%", mx: "auto" }}>
        <Typography sx={{ gridColumn: "1 / -1", fontWeight: 700 }}>👩 暗号化</Typography>
        <BitRow label={`平文「${letter}」`} bits={plain} color={PLAIN_COLOR} />
        <BitRow label="🔑 鍵" bits={key} color={KEY_COLOR} onToggle={toggle} />
        {op}
        <BitRow label="暗号文" bits={cipher} color={CIPHER_COLOR} />
        <Typography sx={{ gridColumn: "1 / -1", fontWeight: 700, mt: 1.5 }}>🧑 復号</Typography>
        <BitRow label="暗号文" bits={cipher} color={CIPHER_COLOR} />
        <BitRow label="🔑 同じ鍵" bits={key} color={KEY_COLOR} />
        {op}
        <BitRow label={`平文「${String.fromCharCode(parseInt(back.join(""), 2))}」`} bits={back} color={PLAIN_COLOR} />
      </Box>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        オレンジの鍵のビットをタップすると 0 と 1 が切りかわります。暗号文は変わりますが、復号の結果はいつも平文と同じです。
      </Typography>
    </Stack>
  );
}

// ---------- 第3章：鍵の長さ ----------

const TRY_PER_SEC_LOG = 12; // 1秒間に 1兆個（10^12 個）
const UNIVERSE_YEARS_LOG = Math.log10(1.38e10);
const YEAR_LOG = Math.log10(365 * 24 * 3600);
const KEY_MARKS = [8, 56, 128, 256].map((v) => ({ value: v, label: `${v}` }));

export function KeyLengthStage() {
  const [bits, setBits] = useState(56);
  const keysLog = bits * Math.log10(2);
  const secLog = keysLog - TRY_PER_SEC_LOG;
  const overUniverse = secLog - YEAR_LOG - UNIVERSE_YEARS_LOG;
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 1 }}>
        <Typography fontWeight={700} sx={{ whiteSpace: "nowrap", color: KEY_COLOR }}>
          🔑 鍵の長さ：{bits} ビット
        </Typography>
        <Slider value={bits} min={8} max={256} step={8} marks={KEY_MARKS} onChange={(_, v) => setBits(v as number)} aria-label="鍵の長さ" sx={{ color: KEY_COLOR }} />
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary">
            鍵の数（2 を {bits} 回かけた数）
          </Typography>
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: CIPHER_COLOR }}>
            <Num text={formatLog10(keysLog)} /> 通り
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", borderColor: overUniverse > 0 ? "success.main" : "#cfd8dc", borderWidth: 2 }}>
          <Typography variant="caption" color="text.secondary">
            全部試すのにかかる時間（1秒に1兆個）
          </Typography>
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: overUniverse > 0 ? PLAIN_COLOR : EVE_COLOR }}>
            <Num text={formatDuration(secLog)} />
          </Typography>
          {overUniverse > 0 && (
            <Typography variant="caption" fontWeight={700} color="success.main">
              宇宙の年齢（約138億年）の <Num text={formatLog10(overUniverse)} /> 倍
            </Typography>
          )}
        </Paper>
      </Box>
      <Box component="table" sx={{ borderCollapse: "collapse", width: "100%", "& td, & th": { border: "1px solid #cfd8dc", px: 1, py: 0.5, fontSize: "0.8rem" } }}>
        <thead>
          <Box component="tr" sx={{ bgcolor: "#eceff1" }}>
            <th>暗号</th>
            <th>鍵の数</th>
            <th>全部試す時間</th>
          </Box>
        </thead>
        <tbody>
          <tr>
            <td>シーザー暗号</td>
            <td>25 通り</td>
            <td>一瞬</td>
          </tr>
          {[56, 128].map((b) => (
            <Box component="tr" key={b} sx={{ bgcolor: b === bits ? "#fff8e1" : undefined }}>
              <td>{b} ビットの鍵</td>
              <td>
                <Num text={formatLog10(b * Math.log10(2))} /> 通り
              </td>
              <td>
                <Num text={formatDuration(b * Math.log10(2) - TRY_PER_SEC_LOG)} />
              </td>
            </Box>
          ))}
        </tbody>
      </Box>
    </Stack>
  );
}

// ---------- 第4章：人数と鍵の数 ----------

const FACES = ["👩", "🧑", "👨", "👧", "👦", "👵", "👴", "🧒", "👱", "🧓"];

export function KeyCountStage() {
  const [n, setN] = useState(4);
  const keys = (n * (n - 1)) / 2;
  const R = 95;
  const C = 130;
  const pos = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
  });
  const edges: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([i, j]);
  return (
    <Stack spacing={1.5}>
      <KeySlider value={n} onChange={setN} label="人数" min={2} max={10} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" }, gap: 2, alignItems: "center" }}>
        <Box component="svg" viewBox="0 0 260 260" role="img" aria-label={`${n}人と、${keys}本の鍵の線`} sx={{ width: "100%", maxWidth: 300, mx: "auto", display: "block" }}>
          {edges.map(([i, j]) => (
            <line key={`${i}-${j}`} x1={pos[i].x} y1={pos[i].y} x2={pos[j].x} y2={pos[j].y} stroke={KEY_COLOR} strokeWidth={2} opacity={0.7} />
          ))}
          {pos.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={17} fill="#fff" stroke="#455a64" strokeWidth={2} />
              <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize={19}>
                {FACES[i]}
              </text>
            </g>
          ))}
        </Box>
        <Stack spacing={1} alignItems="center" sx={{ minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary">
            必要な鍵（線の数）
          </Typography>
          <Typography sx={{ fontSize: "2.4rem", fontWeight: 700, color: KEY_COLOR, lineHeight: 1 }}>{keys} 個</Typography>
          <Typography variant="body2" fontWeight={700}>
            {n} ×（{n} − 1）÷ 2 ＝ {keys}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            1人が持つ鍵：{n - 1} 個
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

// ---------- 第5章：よいところ・困るところ ----------

export function SummaryStage() {
  const cards = [
    {
      title: "👍 よいところ",
      color: PLAIN_COLOR,
      bg: "#f1f8e9",
      items: ["しくみが単純で、暗号化・復号の計算が速い", "動画や大きなファイルなど、たくさんのデータの暗号化に向いている", "鍵が十分に長ければ、総当たりでは解読できない"],
    },
    {
      title: "⚠️ 困るところ",
      color: EVE_COLOR,
      bg: "#ffebee",
      items: ["鍵を安全に相手へ渡すのが難しい（鍵配送問題）", "鍵を盗まれると、暗号文をすべて復号されてしまう", "通信する相手ごとに鍵が必要で、人数が増えると管理が大変"],
    },
  ];
  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        {cards.map((c) => (
          <Box key={c.title} sx={{ border: 2, borderColor: c.color, bgcolor: c.bg, borderRadius: 3, p: 1.5 }}>
            <Typography fontWeight={700} sx={{ color: c.color, fontSize: "1.1rem", mb: 0.75 }}>
              {c.title}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
              {c.items.map((t) => (
                <Typography key={t} component="li" variant="body2" fontWeight={600}>
                  {t}
                </Typography>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ p: 1.25, textAlign: "center" }}>
        <Typography variant="body2" fontWeight={700}>
          🔑 共通鍵暗号方式 ＝ 暗号化と復号に同じ鍵を使う（秘密鍵暗号方式）
        </Typography>
        <Typography variant="caption" color="text.secondary">
          使われている例：AES（Wi-Fi の暗号化、ファイルの暗号化、HTTPS でのデータのやりとり など）
        </Typography>
      </Paper>
    </Stack>
  );
}

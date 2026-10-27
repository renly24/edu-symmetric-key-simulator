"use client";
import { type CSSProperties, type DragEvent, Fragment, type MouseEvent, type PointerEvent, type ReactNode, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ALPHABET, decrypt, encrypt, shiftChar } from "@/lib/cipher";
import { CIPHER_COLOR, EVE_COLOR, KEY_COLOR, PLAIN_COLOR, SUMMARY_ITEMS, type SummaryBin } from "@/lib/model";
import CipherDisk from "./CipherDisk";
import { svgPoint, useDoneWhen } from "./hooks";
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

// ---------- 第1章：暗号のことば（カードを図に入れる） ----------

type TermSlot = "plain" | "enc" | "cipher" | "dec" | "key";

const TERM_ANSWER: Record<TermSlot, string> = { plain: "平文", enc: "暗号化", cipher: "暗号文", dec: "復号", key: "鍵" };
const TERM_HINT: Record<TermSlot, string> = {
  plain: "だれでも読める、元のメッセージのことです。",
  enc: "読めない形に「変える」ことです。",
  cipher: "読めない形に変わったメッセージのことです。",
  dec: "元に「戻す」ことです。",
  key: "どう変えるかを決める、秘密の情報です。",
};
/** カードを並べる順番（図の順番とは変えておく） */
const TERM_CARDS = ["復号", "鍵", "平文", "暗号化", "暗号文"];

/** ドラッグでもタップでも、カードを入れられるようにする */
function dragCard(id: string, picked: string | null, setPicked: (v: string | null) => void) {
  return {
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.setData("text/plain", id);
      setPicked(id);
    },
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      setPicked(picked === id ? null : id);
    },
  };
}

function dropTarget(onPut: (id: string) => void, picked: string | null) {
  return {
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      onPut(e.dataTransfer.getData("text/plain"));
    },
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      if (picked) onPut(picked);
    },
  };
}

export function TermsStage({ onDone }: { onDone?: () => void }) {
  const [filled, setFilled] = useState<TermSlot[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [miss, setMiss] = useState<{ slot: TermSlot; n: number } | null>(null);
  const done = filled.length === 5;
  useDoneWhen(done, onDone);

  const put = (slot: TermSlot, card: string) => {
    if (filled.includes(slot) || !card) return;
    setPicked(null);
    if (TERM_ANSWER[slot] === card) {
      setFilled([...filled, slot]);
      setMiss(null);
    } else {
      setMiss({ slot, n: (miss?.n ?? 0) + 1 });
    }
  };

  const slotView = (slot: TermSlot, small?: boolean) => {
    const ok = filled.includes(slot);
    return (
      <Box
        key={miss?.slot === slot ? `${slot}-${miss.n}` : slot}
        className={miss?.slot === slot ? "shake" : undefined}
        data-slot={slot}
        {...(ok ? {} : dropTarget((c) => put(slot, c), picked))}
        sx={{
          minWidth: small ? 64 : 84,
          px: 1,
          py: 0.25,
          borderRadius: 1.5,
          textAlign: "center",
          fontWeight: 700,
          fontSize: small ? "0.85rem" : "1rem",
          border: ok ? "2px solid transparent" : `2px dashed ${picked ? "#1565c0" : "#90a4ae"}`,
          bgcolor: ok ? "transparent" : picked ? "#e3f2fd" : "#fafafa",
          color: ok ? (slot === "key" ? KEY_COLOR : "text.primary") : "#90a4ae",
          cursor: ok ? "default" : picked ? "pointer" : "default",
        }}
      >
        {ok ? TERM_ANSWER[slot] : "？"}
      </Box>
    );
  };

  const box = (title: ReactNode, sub: string, kind: "plain" | "cipher", text: string) => (
    <Stack alignItems="center" spacing={0.5} sx={{ p: 1.25, borderRadius: 3, bgcolor: "#f5f7fa", minWidth: 120 }}>
      {title}
      <Tag kind={kind} big>
        {text}
      </Tag>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {sub}
      </Typography>
    </Stack>
  );
  const arrow = (label: ReactNode, keyLabel: ReactNode) => (
    <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 90 }}>
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Typography>🔑</Typography>
        {keyLabel}
      </Stack>
      {label}
      <Typography sx={{ fontSize: "1.6rem", lineHeight: 1, color: "#78909c", transform: { xs: "rotate(90deg)", sm: "none" } }}>➜</Typography>
    </Stack>
  );

  return (
    <Stack spacing={2}>
      {/* ことばのカード */}
      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ minHeight: 40 }}>
        {TERM_CARDS.filter((c) => !filled.some((f) => TERM_ANSWER[f] === c)).map((c) => (
          <Box
            key={c}
            {...dragCard(c, picked, setPicked)}
            role="button"
            aria-pressed={picked === c}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 700,
              cursor: "grab",
              userSelect: "none",
              border: "2px solid #1565c0",
              bgcolor: picked === c ? "#1565c0" : "#fff",
              color: picked === c ? "#fff" : "#1565c0",
              boxShadow: 2,
            }}
          >
            {c}
          </Box>
        ))}
        {done && <Typography fontWeight={700}>完成！ 下の要点で確かめよう。</Typography>}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" spacing={1}>
        {box(slotView("plain"), "だれでも読める", "plain", "SUSHI")}
        {arrow(slotView("enc", true), slotView("key", true))}
        {box(slotView("cipher"), "鍵がないと読めない", "cipher", "VXVKL")}
        {arrow(slotView("dec", true), <Typography fontWeight={700} sx={{ color: KEY_COLOR, fontSize: "0.85rem" }}>{filled.includes("key") ? "同じ鍵" : "？"}</Typography>)}
        {box(<Typography fontWeight={700}>{filled.includes("plain") ? "平文" : "？"}</Typography>, "元に戻った", "plain", "SUSHI")}
      </Stack>
      {miss && !done && <Feedback ok={false}>そこではありません。ヒント：そこに入ることばは「{TERM_HINT[miss.slot]}」</Feedback>}
    </Stack>
  );
}

// ---------- 第2章：文字をずらす（シーザー暗号） ----------

/** 平文の段と暗号文の段を並べた表。onPick があれば、文字のダブルクリックで選べる */
function AlphabetStrip({
  shift,
  mark,
  onPick,
}: {
  shift: number;
  mark?: { row: "plain" | "cipher"; col: number };
  onPick?: { row: "plain" | "cipher"; pick: (letter: string) => void };
}) {
  const rows = [
    { name: "平文", kind: "plain" as const, color: PLAIN_COLOR, letter: (i: number) => ALPHABET[i] },
    { name: "暗号文", kind: "cipher" as const, color: CIPHER_COLOR, letter: (i: number) => shiftChar(ALPHABET[i], shift) },
  ];
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "auto repeat(26, minmax(0, 1fr))", gap: { xs: "1px", sm: "2px" }, userSelect: "none" }}>
      {rows.map((r) => (
        <Fragment key={r.name}>
          <Typography sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem" }, fontWeight: 700, color: r.color, pr: 0.5, alignSelf: "center", whiteSpace: "nowrap" }}>{r.name}</Typography>
          {ALPHABET.split("").map((_, i) => {
            const on = mark?.col === i;
            const strong = on && mark?.row === r.kind;
            const pickable = onPick?.row === r.kind;
            return (
              <Box
                key={i}
                onDoubleClick={pickable ? () => onPick!.pick(r.letter(i)) : undefined}
                title={pickable ? "ダブルクリックで入力" : undefined}
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
                  cursor: pickable ? "pointer" : "default",
                  transform: strong ? "scale(1.15)" : "none",
                  transition: "background-color 0.2s, transform 0.2s",
                  "&:hover": pickable ? { bgcolor: "#e3f2fd" } : undefined,
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

export function CaesarStage({ onDone }: { onDone?: () => void }) {
  const [key, setKey] = useState(0);
  const [col, setCol] = useState(0);
  useDoneWhen(key === 3 && col === 0, onDone);
  return (
    <Stack spacing={1.5} alignItems="center">
      <CipherDisk shift={key} onChange={setKey} mark={col} onPick={setCol} />
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
        外側の文字をクリックすると、その文字がどこに移るか見られます。X・Y・Z で試すと、A に戻るのが分かります。
      </Typography>
    </Stack>
  );
}

// ---------- 第2章：手で暗号化・復号する ----------

export function Handwork({ mode, text, keyValue, onDone }: { mode: "encrypt" | "decrypt"; text: string; keyValue: number; onDone?: () => void }) {
  const answer = mode === "encrypt" ? encrypt(text, keyValue) : decrypt(text, keyValue);
  const [values, setValues] = useState<string[]>(() => text.split("").map(() => ""));
  const [focus, setFocus] = useState<number | null>(0);
  const [checked, setChecked] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const correct = values.filter((v, i) => v === answer[i]).length;
  useDoneWhen(checked && correct === text.length, onDone);

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
    // 次の欄へのフォーカス移動は、この入力イベントの処理が完全に終わってから行う。
    // タブレットのソフトウェアキーボードは、onChange の中で同期的にフォーカスを
    // 移すと、入力中の次の文字が新しくフォーカスした欄に流れ込んでしまうことがある。
    if (ch && i < text.length - 1) {
      const nextIndex = i + 1;
      setTimeout(() => inputs.current[nextIndex]?.focus(), 0);
    }
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
      <AlphabetStrip
        shift={keyValue}
        mark={mark}
        onPick={{
          row: to,
          pick: (letter) => {
            if (focus === null) return;
            set(focus, letter);
            if (focus < text.length - 1) setFocus(focus + 1);
          },
        }}
      />
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
                    maxLength: 1,
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
            {correct} / {text.length} 文字正解。赤い欄を選ぶと、表のどこを見ればよいかが光ります。光った文字のすぐ{mode === "encrypt" ? "下" : "上"}の文字をダブルクリックしよう。
            {mode === "decrypt" && "復号では、下の段（暗号文）から探して、上の段（平文）を読みます。"}
          </Feedback>
        ))}
    </Stack>
  );
}

// ---------- 第2章：違う鍵で復号する ----------

const WRONG_CIPHER = "VXVKL";
const WRONG_RIGHT_KEY = 3;

export function WrongKeyStage({ onDone }: { onDone?: () => void }) {
  const [key, setKey] = useState(5);
  const plain = decrypt(WRONG_CIPHER, key);
  const ok = key === WRONG_RIGHT_KEY;
  useDoneWhen(ok, onDone);
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 2, alignItems: "center" }}>
      <CipherDisk shift={key} onChange={setKey} caption="復号は、内側（暗号文）の文字を探して、外側（平文）の文字を読みます" />
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <Typography fontWeight={700}>届いた暗号文</Typography>
          <Tag kind="cipher" big>
            {WRONG_CIPHER}
          </Tag>
        </Stack>
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderWidth: 2, borderColor: ok ? "success.main" : "#cfd8dc", bgcolor: ok ? "#f1f8e9" : "#fafafa" }}>
          <Typography variant="caption" color="text.secondary">
            鍵 {key} で復号した結果
          </Typography>
          <Stack direction="row" spacing={0.75} justifyContent="center" my={1}>
            {plain.split("").map((c, i) => (
              <Box key={`${key}-${i}`} className="seq-anim" sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "2rem", color: ok ? PLAIN_COLOR : "#90a4ae", width: 32 }}>
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
    </Box>
  );
}

// ---------- 第4章：人数と鍵の数 ----------

const FACES = ["👩", "🧑", "👨", "👧", "👦", "👵", "👴", "🧒", "👱", "🧓"];
const DRAW_N = 4;
const NODE_R = 19;

function circlePos(n: number) {
  const R = 95;
  const C = 130;
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: C + R * Math.cos(a), y: C + R * Math.sin(a) };
  });
}

const edgeId = (i: number, j: number) => (i < j ? `${i}-${j}` : `${j}-${i}`);

export function KeyCountStage({ onDone }: { onDone?: () => void }) {
  /** 4人の間に、自分で引いた線 */
  const [edges, setEdges] = useState<string[]>([]);
  /** 線を引いている途中（どの人から・いまのカーソル位置） */
  const [from, setFrom] = useState<number | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [n, setN] = useState(DRAW_N);
  const svgRef = useRef<SVGSVGElement>(null);
  const need = (DRAW_N * (DRAW_N - 1)) / 2;
  const drawn = edges.length === need;
  useDoneWhen(drawn, onDone);

  const people = drawn ? n : DRAW_N;
  const pos = circlePos(people);
  const keys = (people * (people - 1)) / 2;
  const allEdges: [number, number][] = [];
  for (let i = 0; i < people; i++) for (let j = i + 1; j < people; j++) allEdges.push([i, j]);
  const shown = drawn ? allEdges : allEdges.filter(([i, j]) => edges.includes(edgeId(i, j)));

  const nodeAt = (x: number, y: number) => pos.findIndex((p) => Math.hypot(p.x - x, p.y - y) < NODE_R + 6);
  const connect = (i: number, j: number) => {
    if (i !== j && !edges.includes(edgeId(i, j))) setEdges([...edges, edgeId(i, j)]);
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (drawn) return;
    const p = svgPoint(svgRef.current!, e.clientX, e.clientY);
    const i = nodeAt(p.x, p.y);
    if (i < 0) return;
    // タップで選んでおいた人がいれば、その人とつなぐ
    if (from !== null && cursor === null && from !== i) {
      connect(from, i);
      setFrom(null);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setFrom(i);
    setCursor(p);
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (from === null || cursor === null) return;
    setCursor(svgPoint(svgRef.current!, e.clientX, e.clientY));
  };
  const onUp = (e: PointerEvent<SVGSVGElement>) => {
    if (from === null || cursor === null) return;
    const p = svgPoint(svgRef.current!, e.clientX, e.clientY);
    const j = nodeAt(p.x, p.y);
    setCursor(null);
    if (j >= 0 && j !== from) {
      connect(from, j);
      setFrom(null);
    }
    // 同じ人の上で離したときは、タップで選んだことにする（次にタップした人とつなぐ）
    else if (j !== from) setFrom(null);
  };

  return (
    <Stack spacing={1.5}>
      {drawn ? (
        <KeySlider value={n} onChange={setN} label="人数" min={2} max={10} />
      ) : (
        <Typography variant="body2" fontWeight={700} textAlign="center" sx={{ color: KEY_COLOR }}>
          ✏️ 人から人へドラッグして、2人の間に鍵（線）を作ろう
        </Typography>
      )}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" }, gap: 2, alignItems: "center" }}>
        <Box
          component="svg"
          ref={svgRef}
          viewBox="0 0 260 260"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          role="img"
          aria-label={`${people}人と、${shown.length}本の鍵の線`}
          sx={{ width: "100%", maxWidth: 300, mx: "auto", display: "block", touchAction: "none", userSelect: "none", cursor: drawn ? "default" : "crosshair" }}
        >
          {shown.map(([i, j]) => (
            <line key={edgeId(i, j)} x1={pos[i].x} y1={pos[i].y} x2={pos[j].x} y2={pos[j].y} stroke={KEY_COLOR} strokeWidth={2.5} opacity={0.75} />
          ))}
          {from !== null && cursor && <line x1={pos[from].x} y1={pos[from].y} x2={cursor.x} y2={cursor.y} stroke={KEY_COLOR} strokeWidth={2.5} strokeDasharray="5 4" />}
          {pos.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={NODE_R} fill={from === i ? "#fff3e0" : "#fff"} stroke={from === i ? KEY_COLOR : "#455a64"} strokeWidth={from === i ? 3 : 2} />
              <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize={20} pointerEvents="none">
                {FACES[i]}
              </text>
            </g>
          ))}
        </Box>
        <Stack spacing={1} alignItems="center" sx={{ minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary">
            {drawn ? "必要な鍵（線の数）" : "作った鍵（線の数）"}
          </Typography>
          <Typography sx={{ fontSize: "2.4rem", fontWeight: 700, color: KEY_COLOR, lineHeight: 1 }}>{drawn ? keys : edges.length} 個</Typography>
          {drawn ? (
            <>
              <Typography variant="body2" fontWeight={700}>
                {people} ×（{people} − 1）÷ 2 ＝ {keys}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                1人が持つ鍵：{people - 1} 個
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              どの2人の間にも、鍵が1つずつ必要です
            </Typography>
          )}
        </Stack>
      </Box>
      {drawn && (
        <Feedback ok>
          4人なら、鍵は {need} 個必要でした。上のつまみで人数を増やすと、鍵の数がどんどん増えていくのが分かります。
        </Feedback>
      )}
      {!drawn && edges.length > 0 && (
        <Box>
          <Button size="small" variant="outlined" onClick={() => setEdges([])}>
            線を消す
          </Button>
        </Box>
      )}
    </Stack>
  );
}

// ---------- 第5章：よいところ・困るところに仕分ける ----------

export function SummaryStage({ onDone }: { onDone?: () => void }) {
  const [box, setBox] = useState<Record<string, SummaryBin | undefined>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [miss, setMiss] = useState<{ label: string; n: number } | null>(null);
  const placed = SUMMARY_ITEMS.filter((i) => box[i.label]).length;
  const done = placed === SUMMARY_ITEMS.length;
  useDoneWhen(done, onDone);

  const put = (bin: SummaryBin, label: string) => {
    const item = SUMMARY_ITEMS.find((i) => i.label === label);
    if (!item || box[label]) return;
    setPicked(null);
    if (item.answer === bin) {
      setBox({ ...box, [label]: bin });
      setMiss(null);
    } else {
      setMiss({ label, n: (miss?.n ?? 0) + 1 });
    }
  };

  const bins: { bin: SummaryBin; title: string; color: string; bg: string }[] = [
    { bin: "good", title: "👍 長所", color: PLAIN_COLOR, bg: "#f1f8e9" },
    { bin: "bad", title: "⚠️ 課題", color: EVE_COLOR, bg: "#ffebee" },
  ];

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ minHeight: 40 }}>
        {SUMMARY_ITEMS.filter((i) => !box[i.label]).map((i) => (
          <Box
            key={miss?.label === i.label ? `${i.label}-${miss.n}` : i.label}
            className={miss?.label === i.label ? "shake" : undefined}
            {...dragCard(i.label, picked, setPicked)}
            role="button"
            aria-pressed={picked === i.label}
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "grab",
              userSelect: "none",
              border: `2px solid ${miss?.label === i.label ? EVE_COLOR : "#1565c0"}`,
              bgcolor: picked === i.label ? "#1565c0" : "#fff",
              color: picked === i.label ? "#fff" : "#1565c0",
              boxShadow: 2,
            }}
          >
            {i.label}
          </Box>
        ))}
        {done && <Typography fontWeight={700}>全部仕分けられました！</Typography>}
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
        {bins.map((b) => (
          <Box
            key={b.bin}
            data-bin={b.bin}
            {...dropTarget((label) => put(b.bin, label), picked)}
            sx={{ border: `2px ${picked ? "dashed" : "solid"} ${b.color}`, bgcolor: b.bg, borderRadius: 3, p: 1.5, minHeight: 160, cursor: picked ? "pointer" : "default" }}
          >
            <Typography fontWeight={700} sx={{ color: b.color, fontSize: "1.1rem", mb: 0.75 }}>
              {b.title}
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
              {SUMMARY_ITEMS.filter((i) => box[i.label] === b.bin).map((i) => (
                <Typography key={i.label} component="li" variant="body2" fontWeight={600}>
                  {i.label}
                </Typography>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
      {miss && !done && <Feedback ok={false}>「{miss.label}」は、そちらではありません。ここまでの体験を思い出してみよう。</Feedback>}
      {done && (
        <Paper variant="outlined" sx={{ p: 1.25, textAlign: "center" }}>
          <Typography variant="body2" fontWeight={700}>
            🔑 共通鍵暗号方式（対称鍵暗号）＝ 暗号化と復号に同じ鍵（共通鍵）を使う
          </Typography>
          <Typography variant="caption" color="text.secondary">
            代表的な暗号化アルゴリズム：AES（無線 LAN の通信を守る規格 WPA2・WPA3 で使われている）
          </Typography>
        </Paper>
      )}
    </Stack>
  );
}

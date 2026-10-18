"use client";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { encrypt } from "@/lib/cipher";
import { CIPHER_COLOR, EVE_COLOR, PLAIN_COLOR } from "@/lib/model";
import { svgPoint, useDoneWhen } from "./hooks";

// ---------- 盗聴者になって、通信路の上を虫めがねでのぞく ----------

const W = 420;
const H = 170;
const LINE_Y = 80;
const X0 = 70;
const X1 = 350;
const LENS_R = 38;
/** 1つのメッセージが通信路を流れきる秒数 */
const TRAVEL = 6;
const PEEK_KEY = 3;

const MESSAGES = ["SUSHI", "EKIMAE", "HIMITSU"];

export default function PeekStage({ mode, onDone }: { mode: "plain" | "cipher"; onDone?: () => void }) {
  const [time, setTime] = useState(0);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  useDoneWhen(seen.length === MESSAGES.length, onDone);

  // メッセージを流し続ける
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setTime((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const text = (i: number) => (mode === "plain" ? MESSAGES[i] : encrypt(MESSAGES[i], PEEK_KEY));
  // 3つのメッセージが、間をあけて順に流れる
  const packets = MESSAGES.map((_, i) => {
    const phase = (((time / TRAVEL + i / MESSAGES.length) % 1) + 1) % 1;
    return { i, x: X0 + (X1 - X0) * phase };
  });
  const inLens = (x: number) => lens !== null && Math.abs(lens.x - x) < LENS_R + 20 && Math.abs(lens.y - LINE_Y) < LENS_R + 10;

  // 虫めがねに入ったメッセージを、のぞき見たことにする
  const peeking = packets.filter((p) => inLens(p.x)).map((p) => p.i);
  const newly = peeking.filter((i) => !seen.includes(i));
  if (newly.length > 0) setSeen([...seen, ...newly]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => setLens(svgPoint(svgRef.current!, e.clientX, e.clientY));
  const color = mode === "plain" ? PLAIN_COLOR : CIPHER_COLOR;

  return (
    <Stack spacing={1.5}>
      <Box
        component="svg"
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setLens(null)}
        role="img"
        aria-label="通信路を流れるメッセージ。カーソルを当てると中身が見える"
        sx={{ width: "100%", maxWidth: 560, mx: "auto", display: "block", bgcolor: "#fff", borderRadius: 2, border: "1px solid #e0e0e0", cursor: "none", touchAction: "none", userSelect: "none" }}
      >
        <defs>
          <clipPath id={`lens-${mode}`}>{lens && <circle cx={lens.x} cy={lens.y} r={LENS_R} />}</clipPath>
        </defs>
        <text x={X0 - 32} y={LINE_Y + 8} textAnchor="middle" fontSize={26}>
          👩
        </text>
        <text x={X1 + 32} y={LINE_Y + 8} textAnchor="middle" fontSize={26}>
          🧑
        </text>
        <line x1={X0} y1={LINE_Y} x2={X1} y2={LINE_Y} stroke="#90a4ae" strokeWidth={6} strokeLinecap="round" />
        <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={11} fill="#78909c">
          通信路の上でカーソル（指）を動かして、のぞいてみよう
        </text>
        {/* 虫めがねの外：中身の見えない封筒 */}
        {packets.map((p) => (
          <g key={p.i}>
            <rect x={p.x - 22} y={LINE_Y - 13} width={44} height={26} rx={4} fill="#eceff1" stroke="#90a4ae" strokeWidth={2} />
            <text x={p.x} y={LINE_Y + 6} textAnchor="middle" fontSize={15}>
              ✉️
            </text>
          </g>
        ))}
        {/* 虫めがねの中：中身が見える */}
        {lens && (
          <g clipPath={`url(#lens-${mode})`}>
            <rect x={0} y={0} width={W} height={H} fill="#fffde7" />
            <line x1={X0} y1={LINE_Y} x2={X1} y2={LINE_Y} stroke="#90a4ae" strokeWidth={6} />
            {packets.map((p) => (
              <g key={p.i}>
                <rect x={p.x - 40} y={LINE_Y - 14} width={80} height={28} rx={4} fill="#fff" stroke={color} strokeWidth={2.5} />
                <text x={p.x} y={LINE_Y + 6} textAnchor="middle" fontSize={14} fontWeight={700} fill={color} fontFamily="monospace">
                  {text(p.i)}
                </text>
              </g>
            ))}
          </g>
        )}
        {lens && (
          <g pointerEvents="none">
            <circle cx={lens.x} cy={lens.y} r={LENS_R} fill="none" stroke={EVE_COLOR} strokeWidth={4} />
            <line x1={lens.x + LENS_R * 0.7} y1={lens.y + LENS_R * 0.7} x2={lens.x + LENS_R * 1.3} y2={lens.y + LENS_R * 1.3} stroke={EVE_COLOR} strokeWidth={7} strokeLinecap="round" />
          </g>
        )}
      </Box>
      <Paper variant="outlined" sx={{ p: 1.25, borderColor: EVE_COLOR, bgcolor: "#fff8f8" }}>
        <Typography variant="body2" fontWeight={700} sx={{ color: EVE_COLOR, mb: 0.5 }}>
          🕵️ のぞき見たメッセージ（{seen.length} / {MESSAGES.length}）
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {MESSAGES.map((_, i) => (
            <Box
              key={i}
              sx={{ border: `2px solid ${seen.includes(i) ? color : "#cfd8dc"}`, borderRadius: 1, px: 1, py: 0.25, fontFamily: "monospace", fontWeight: 700, color: seen.includes(i) ? color : "#b0bec5", minWidth: 80, textAlign: "center" }}
            >
              {seen.includes(i) ? text(i) : "？？？"}
            </Box>
          ))}
        </Stack>
        {seen.length === MESSAGES.length && (
          <Typography variant="body2" fontWeight={700} mt={0.75}>
            {mode === "plain"
              ? "全部読めてしまった！ そのまま送ったメッセージは、のぞかれると中身が丸見えです。"
              : "のぞき見ることはできたけれど、鍵を知らないので意味が分からない！ これが暗号化の効果です。"}
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}

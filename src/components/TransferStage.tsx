"use client";
import { type CSSProperties, type PointerEvent, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ReplayIcon from "@mui/icons-material/Replay";
import { CIPHER_COLOR, EVE_COLOR, KEY_COLOR, PLAIN_COLOR } from "@/lib/model";
import { SCENES, type Bubble, type PacketKind, type SceneId, type Who } from "@/lib/transfer";
import { svgPoint, useDoneWhen } from "./hooks";

// ---------- 送受信の図（Aさん → Bさん、間で盗聴者がのぞき見る） ----------

const W = 420;
const H = 250;
const LINE_Y = 92;
const AX = 62;
const BX = 358;
const EVE_X = 210;
const EVE_Y = 200;
const PACKET_W = 78;
const PACKET_H = 26;
/** 流れる秒数 */
const MOVE = 0.9;

const PACKET_COLOR: Record<PacketKind, string> = { plain: PLAIN_COLOR, cipher: CIPHER_COLOR, key: KEY_COLOR };

const PEOPLE: Record<Who, { x: number; y: number; icon: string; name: string }> = {
  a: { x: AX, y: LINE_Y, icon: "👩", name: "Aさん" },
  b: { x: BX, y: LINE_Y, icon: "🧑", name: "Bさん" },
  eve: { x: EVE_X, y: EVE_Y, icon: "🕵️", name: "盗聴者" },
};

function timing(delay: number, dur = 0.25, extra?: Record<string, string>): CSSProperties {
  return { "--delay": `${delay}s`, "--dur": `${dur}s`, ...extra } as CSSProperties;
}

/** 文字の幅をおおまかに見積もる（全角 12px・半角 7px） */
function textWidth(text: string, size = 12) {
  return [...text].reduce((w, c) => w + (c.charCodeAt(0) > 255 ? size : size * 0.6), 0);
}

/** keyDelay：鍵が届いたときは、届くまで鍵の印を見せない */
function Person({ who, hasKey, keyDelay }: { who: Who; hasKey: boolean; keyDelay?: number }) {
  const p = PEOPLE[who];
  const color = who === "eve" ? EVE_COLOR : "#263238";
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={26} fill="#fff" stroke={color} strokeWidth={2.5} />
      <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={26}>
        {p.icon}
      </text>
      <text x={p.x} y={p.y + 44} textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>
        {p.name}
      </text>
      {hasKey && (
        <g className={keyDelay ? "pop" : undefined} style={keyDelay ? timing(keyDelay) : undefined}>
          <rect x={p.x + 14} y={p.y - 32} width={26} height={20} rx={10} fill={KEY_COLOR} />
          <text x={p.x + 27} y={p.y - 17} textAnchor="middle" fontSize={12}>
            🔑
          </text>
        </g>
      )}
    </g>
  );
}

function SpeechBubble({ who, bubble, delay }: { who: Who; bubble: Bubble; delay: number }) {
  const p = PEOPLE[who];
  const w = textWidth(bubble.text) + 18;
  const h = 26;
  // 吹き出しの位置：A・B は頭の上、盗聴者は右側
  const x = who === "eve" ? p.x + 34 : Math.min(Math.max(p.x - w / 2, 4), W - w - 4);
  const y = who === "eve" ? p.y - h / 2 : 8;
  const color = bubble.alert ? EVE_COLOR : "#455a64";
  return (
    <g className="pop" style={timing(delay)}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={bubble.alert ? "#ffebee" : "#fff"} stroke={color} strokeWidth={1.5} />
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fontSize={12} fontWeight={700} fill={color}>
        {bubble.text}
      </text>
    </g>
  );
}

function Packet({ label, kind, x, y, from }: { label: string; kind: PacketKind; x: number; y: number; from?: { dx: number; dy: number; delay: number } }) {
  const color = PACKET_COLOR[kind];
  return (
    // 遅れて流れ出すものは、流れ出すまで見せない
    <g className={from ? "pop" : undefined} style={from ? timing(from.delay, 0.01) : undefined}>
      <g
        className={from ? "move" : undefined}
        style={from ? timing(from.delay, MOVE - from.delay, { "--fx": `${from.dx}px`, "--fy": `${from.dy}px` }) : undefined}
      >
        <rect x={x - PACKET_W / 2} y={y - PACKET_H / 2} width={PACKET_W} height={PACKET_H} rx={5} fill="#fff" stroke={color} strokeWidth={2.5} />
        <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={color} fontFamily={kind === "key" ? undefined : "monospace"}>
          {label}
        </text>
      </g>
    </g>
  );
}

export default function TransferStage({ scene: id, onDone }: { scene: SceneId; onDone?: () => void }) {
  const scene = SCENES[id];
  const [step, setStep] = useState(0);
  /** 進めたときだけ、流れるアニメーションを見せる */
  const [run, setRun] = useState(0);
  /** ドラッグ中の札の位置（x 座標） */
  const [dragX, setDragX] = useState<number | null>(null);
  /** ドラッグ中に、盗聴者がもうコピーしたか */
  const [copied, setCopied] = useState(false);
  /** 直前のステップを、ドラッグで送ったか（アニメーションを省く） */
  const [dragged, setDragged] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const total = scene.steps.length;
  const current = step > 0 ? scene.steps[step - 1] : undefined;
  const keys = current?.keys ?? scene.keys;
  // 前のステップと同じものが流れているときは、止まった状態で表示する
  const prev = step > 1 ? scene.steps[step - 2] : undefined;
  const fresh = Boolean(current?.packet && current.packet.label !== prev?.packet?.label);
  const prevKeys = prev?.keys ?? scene.keys;
  const animate = fresh && !dragged;
  // 次のステップで新しい札が流れるときは、自分でドラッグして送る
  const pending = step < total ? scene.steps[step] : undefined;
  const needsDrag = Boolean(pending?.packet && pending.packet.label !== current?.packet?.label);
  useDoneWhen(step === total, onDone);

  const bx = BX - 70;
  const ax = AX + 70;
  const midY = EVE_Y - 52;

  const go = (next: number, byDrag = false) => {
    setStep(Math.max(0, Math.min(total, next)));
    setRun(run + 1);
    setDragX(null);
    setCopied(false);
    setDragged(byDrag);
  };

  const onDown = (e: PointerEvent<SVGGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragX(ax);
  };
  const onMove = (e: PointerEvent<SVGGElement>) => {
    if (dragX === null) return;
    const x = Math.max(ax, Math.min(bx, svgPoint(svgRef.current!, e.clientX, e.clientY).x));
    setDragX(x);
    if (pending?.tapped && x >= EVE_X && !copied) setCopied(true);
  };
  const onUp = () => {
    if (dragX === null) return;
    if (dragX >= bx - 20) go(step + 1, true);
    else setDragX(null);
  };

  const showCurrentPacket = current?.packet && !needsDrag;

  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Typography fontWeight={700}>{scene.caption}</Typography>
      <Box
        key={run}
        ref={svgRef}
        component="svg"
        className="seq-anim"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${scene.caption}の図`}
        sx={{ width: "100%", maxWidth: 560, mx: "auto", height: "auto", display: "block", bgcolor: "#fff", borderRadius: 2, border: "1px solid #e0e0e0", touchAction: "none", userSelect: "none" }}
      >
        {/* 通信路 */}
        <line x1={AX + 30} y1={LINE_Y} x2={BX - 30} y2={LINE_Y} stroke="#90a4ae" strokeWidth={6} strokeLinecap="round" />
        <text x={(AX + EVE_X) / 2 + 10} y={LINE_Y - 12} textAnchor="middle" fontSize={11} fill="#78909c">
          通信路
        </text>
        {/* 盗聴者がのぞいている線 */}
        <line x1={EVE_X} y1={LINE_Y + 4} x2={EVE_X} y2={EVE_Y - 28} stroke={EVE_COLOR} strokeWidth={2} strokeDasharray="5 4" opacity={0.6} />

        {showCurrentPacket && current?.packet && (
          <>
            <Packet {...current.packet} x={bx} y={LINE_Y} from={animate ? { dx: ax - bx, dy: 0, delay: 0 } : undefined} />
            {current.tapped && <Packet {...current.packet} x={EVE_X} y={midY} from={animate ? { dx: 0, dy: LINE_Y - midY, delay: MOVE * 0.4 } : undefined} />}
          </>
        )}

        {/* 自分でドラッグして送る札 */}
        {needsDrag && pending?.packet && (
          <>
            {dragX === null && (
              <g className="pop" style={timing(0.2)}>
                <text x={(ax + bx) / 2} y={LINE_Y + 30} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1565c0">
                  ドラッグして送ろう ➜
                </text>
                <line x1={bx} y1={LINE_Y - 18} x2={bx} y2={LINE_Y + 18} stroke="#1565c0" strokeWidth={2} strokeDasharray="3 3" />
              </g>
            )}
            {copied && <Packet {...pending.packet} x={EVE_X} y={midY} from={{ dx: 0, dy: LINE_Y - midY, delay: 0 }} />}
            <g onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ cursor: dragX === null ? "grab" : "grabbing" }}>
              <g className={dragX === null ? "drag-hint" : undefined}>
                <Packet {...pending.packet} x={dragX ?? ax} y={LINE_Y} />
              </g>
            </g>
          </>
        )}

        {(["a", "b", "eve"] as Who[]).map((w) => (
          <Person key={w} who={w} hasKey={keys.includes(w)} keyDelay={animate && !prevKeys.includes(w) ? MOVE : undefined} />
        ))}
        {current?.bubbles &&
          (Object.entries(current.bubbles) as [Who, Bubble][]).map(([w, b]) => <SpeechBubble key={w} who={w} bubble={b} delay={animate && w !== "a" ? MOVE : 0.15} />)}
      </Box>
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
        {(
          [
            ["平文", PLAIN_COLOR],
            ["暗号文", CIPHER_COLOR],
            ["鍵", KEY_COLOR],
          ] as const
        ).map(([name, color]) => (
          <Stack key={name} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, border: `2.5px solid ${color}` }} />
            <Typography variant="caption">{name}</Typography>
          </Stack>
        ))}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption">🔑 ＝ 鍵を持っている</Typography>
        </Stack>
      </Stack>
      <Paper variant="outlined" sx={{ p: 1, minHeight: 72, bgcolor: "#f5f7fa" }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          {step === 0 ? "はじめ" : `ステップ ${step} / ${total}`}
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.7 }} aria-live="polite">
          {current ? current.text : scene.intro}
        </Typography>
        {needsDrag && pending?.packet && (
          <Typography variant="body2" fontWeight={700} sx={{ color: "#1565c0", mt: 0.5 }}>
            👉 「{pending.packet.label}」の札を、Bさんの点線までドラッグして送ろう
          </Typography>
        )}
      </Paper>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Button size="small" variant="outlined" startIcon={<NavigateBeforeIcon />} disabled={step === 0} onClick={() => go(step - 1)}>
          戻る
        </Button>
        {step === total ? (
          <Button size="small" variant="contained" startIcon={<ReplayIcon />} onClick={() => go(0)}>
            最初から
          </Button>
        ) : needsDrag ? (
          <Button size="small" variant="outlined" endIcon={<NavigateNextIcon />} onClick={() => go(step + 1)}>
            自動で送る
          </Button>
        ) : (
          <Button size="small" variant="contained" endIcon={<NavigateNextIcon />} onClick={() => go(step + 1)}>
            1つ進める
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

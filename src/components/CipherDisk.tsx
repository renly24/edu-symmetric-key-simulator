"use client";
import { type PointerEvent, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import { ALPHABET } from "@/lib/cipher";
import { CIPHER_COLOR, KEY_COLOR, PLAIN_COLOR } from "@/lib/model";
import { svgPoint, useWheelStep } from "./hooks";

// ---------- 暗号円盤（外側が平文、内側が暗号文。内側を回すと鍵が変わる） ----------

const SIZE = 280;
const C = SIZE / 2;
const R_OUT = 122;
const R_IN = 90;
const STEP = 360 / 26;

const mod26 = (n: number) => ((n % 26) + 26) % 26;

function angleOf(x: number, y: number) {
  return (Math.atan2(y - C, x - C) * 180) / Math.PI;
}

function Ring({ r, color, mark, onPick }: { r: number; color: string; mark?: number; onPick?: (i: number) => void }) {
  return (
    <>
      {ALPHABET.split("").map((c, i) => {
        const a = ((i * STEP - 90) * Math.PI) / 180;
        const x = C + r * Math.cos(a);
        const y = C + r * Math.sin(a);
        const on = mark === i;
        return (
          <g
            key={c}
            onClick={onPick ? () => onPick(i) : undefined}
            style={{ cursor: onPick ? "pointer" : undefined }}
            transform={`rotate(${i * STEP} ${x} ${y})`}
          >
            <circle cx={x} cy={y} r={12} fill={on ? "#fff176" : "#fff"} stroke={color} strokeWidth={on ? 2.5 : 1} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill={color} fontFamily="monospace">
              {c}
            </text>
          </g>
        );
      })}
    </>
  );
}

export interface CipherDiskProps {
  /** ずらす数（鍵）。0〜25 */
  shift: number;
  onChange: (shift: number) => void;
  /** 光らせる外側（平文）の文字の位置 */
  mark?: number;
  /** 外側の文字をクリックしたとき */
  onPick?: (i: number) => void;
  caption?: string;
}

export default function CipherDisk({ shift, onChange, mark, onPick, caption }: CipherDiskProps) {
  // 何周回したかも覚えておき、Z → A のところで逆向きに1周しないようにする
  const [rot, setRot] = useState(shift);
  const [drag, setDrag] = useState<{ startAngle: number; startRot: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const turn = (next: number) => {
    setRot(next);
    if (mod26(next) !== shift) onChange(mod26(next));
  };
  useWheelStep(svgRef, (dir) => turn(rot + dir));

  const onDown = (e: PointerEvent<SVGGElement>) => {
    const p = svgPoint(svgRef.current!, e.clientX, e.clientY);
    setDrag({ startAngle: angleOf(p.x, p.y), startRot: rot });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<SVGGElement>) => {
    if (!drag) return;
    const p = svgPoint(svgRef.current!, e.clientX, e.clientY);
    let d = angleOf(p.x, p.y) - drag.startAngle;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    // 時計回りに回すと、内側の文字は時計回りに動く（＝鍵が小さくなる）
    const next = drag.startRot - Math.round(d / STEP);
    if (next !== rot) turn(next);
  };
  const onUp = () => {
    setDrag(null);
  };

  const inner = mark !== undefined ? ALPHABET[mod26(mark + shift)] : undefined;

  return (
    <Stack spacing={1} alignItems="center">
      <Box
        component="svg"
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`暗号円盤。鍵は ${shift}`}
        sx={{ width: "100%", maxWidth: 300, display: "block", touchAction: "none", userSelect: "none" }}
      >
        <circle cx={C} cy={C} r={R_OUT + 16} fill="#f1f8e9" stroke={PLAIN_COLOR} strokeWidth={2} />
        <Ring r={R_OUT} color={PLAIN_COLOR} mark={mark} onPick={onPick} />
        {/* 内側の円盤（ドラッグで回せる） */}
        <g onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ cursor: "grab" }}>
          <g style={{ transform: `rotate(${-rot * STEP}deg)`, transformOrigin: `${C}px ${C}px`, transition: drag ? "none" : "transform 0.25s" }}>
            <circle cx={C} cy={C} r={R_IN + 16} fill="#f3e5f5" stroke={CIPHER_COLOR} strokeWidth={2} />
            <Ring r={R_IN} color={CIPHER_COLOR} mark={mark !== undefined ? mod26(mark + shift) : undefined} />
            <circle cx={C} cy={C} r={R_IN - 18} fill="#fff" stroke={CIPHER_COLOR} strokeWidth={1} strokeDasharray="4 3" />
          </g>
          <text x={C} y={C - 6} textAnchor="middle" fontSize={13} fontWeight={700} fill={KEY_COLOR}>
            🔑 鍵
          </text>
          <text x={C} y={C + 24} textAnchor="middle" fontSize={30} fontWeight={700} fill={KEY_COLOR}>
            {shift}
          </text>
        </g>
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button size="small" variant="outlined" startIcon={<RotateLeftIcon />} onClick={() => turn(rot - 1)} sx={{ color: KEY_COLOR, borderColor: KEY_COLOR }}>
          鍵 −1
        </Button>
        <Button size="small" variant="outlined" endIcon={<RotateRightIcon />} onClick={() => turn(rot + 1)} sx={{ color: KEY_COLOR, borderColor: KEY_COLOR }}>
          鍵 ＋1
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" textAlign="center">
        {caption ?? "外側（緑）が平文、内側（紫）が暗号文。ホイールを回すか、内側をドラッグして回そう"}
        {inner && mark !== undefined && (
          <>
            <br />
            <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
              平文 {ALPHABET[mark]} → 暗号文 {inner}
            </Box>
          </>
        )}
      </Typography>
    </Stack>
  );
}

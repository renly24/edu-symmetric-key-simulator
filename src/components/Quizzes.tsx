"use client";
import { type ReactNode, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { ORDER_HINT, ORDER_SHOWN, ORDER_STEPS, TEST_QUESTIONS, slideIndexOf, type ChoiceQuiz } from "@/lib/model";

// ---------- 共通部品 ----------

export function Feedback({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderLeft: 4,
        borderColor: ok ? "success.main" : "error.main",
        bgcolor: ok ? "#f1f8e9" : "#ffebee",
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
      }}
    >
      {ok ? <CheckCircleIcon color="success" fontSize="small" sx={{ mt: 0.25 }} /> : <CancelIcon color="error" fontSize="small" sx={{ mt: 0.25 }} />}
      <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
        {children}
      </Typography>
    </Paper>
  );
}

function OptionButton({
  label,
  state,
  onClick,
  disabled,
}: {
  label: ReactNode;
  state?: "ok" | "ng" | "picked";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={state === "picked" ? "contained" : "outlined"}
      color={state === "ok" ? "success" : state === "ng" ? "error" : "primary"}
      onClick={onClick}
      disabled={disabled && !state}
      sx={{
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        fontWeight: 700,
        borderWidth: 2,
        "&:hover": { borderWidth: 2 },
        bgcolor: state === "ok" ? "#e8f5e9" : state === "ng" ? "#ffebee" : undefined,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      {label}
    </Button>
  );
}

// ---------- 選択問題（予想問題・確認問題） ----------

export function ChoiceQuizView({ quiz, value, onAnswer }: { quiz: ChoiceQuiz; value: number | undefined; onAnswer: (v: number) => void }) {
  const answered = value !== undefined;
  return (
    <Stack spacing={1}>
      <Typography fontWeight={700}>Q. {quiz.question}</Typography>
      <Stack spacing={0.75}>
        {quiz.options.map((o, i) => (
          <OptionButton
            key={o}
            label={o}
            disabled={answered}
            state={answered ? (i === quiz.answer ? "ok" : i === value ? "ng" : undefined) : undefined}
            onClick={() => onAnswer(i)}
          />
        ))}
      </Stack>
      {answered && <Feedback ok={value === quiz.answer}>{value === quiz.answer ? quiz.ok : quiz.ng}</Feedback>}
    </Stack>
  );
}

// ---------- 体験問題：手順の並べ替え ----------

export function OrderQuiz() {
  const [placed, setPlaced] = useState(0);
  const [miss, setMiss] = useState(false);
  const done = placed === ORDER_STEPS.length;

  const pick = (i: number) => {
    if (i < placed) return;
    if (i !== placed) {
      setMiss(true);
      return;
    }
    setPlaced(placed + 1);
    setMiss(false);
  };

  return (
    <Stack spacing={1.5}>
      {/* 並べた手順 */}
      <Stack spacing={0.5}>
        {ORDER_STEPS.map((s, i) => (
          <Paper
            key={s}
            variant="outlined"
            sx={{ p: 1, display: "flex", gap: 1, alignItems: "center", borderStyle: i < placed ? "solid" : "dashed", bgcolor: i < placed ? "#e8f5e9" : "#fafafa" }}
          >
            <Typography fontWeight={700} sx={{ color: i < placed ? "success.main" : "text.disabled", minWidth: 24 }}>
              {i + 1}.
            </Typography>
            <Typography variant="body2" fontWeight={700} color={i < placed ? "text.primary" : "text.disabled"}>
              {i < placed ? s : "？"}
            </Typography>
          </Paper>
        ))}
      </Stack>
      <Stack spacing={1}>
        <Typography fontWeight={700}>Q. {done ? "完成！" : `${placed + 1}番目の手順は？`}</Typography>
        {ORDER_SHOWN.map((i) => (
          <OptionButton key={i} label={ORDER_STEPS[i]} state={i < placed ? "ok" : undefined} disabled={done || i < placed} onClick={() => pick(i)} />
        ))}
        {done ? (
          <Feedback ok>
            正解！ 共通鍵暗号方式では、まず2人が同じ鍵を安全に共有しておくことが大前提です。そのうえで、送る側が暗号化し、受け取る側が同じ鍵で復号します。
          </Feedback>
        ) : (
          miss && <Feedback ok={false}>{ORDER_HINT[placed]}</Feedback>
        )}
        {placed > 0 && (
          <Box>
            <Button
              variant="outlined"
              onClick={() => {
                setPlaced(0);
                setMiss(false);
              }}
            >
              最初から
            </Button>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

// ---------- まとめテスト ----------

export interface TestState {
  answers: (number | undefined)[];
  graded: boolean;
  /** 結果画面をスクリーンショットで提出するときの名前 */
  name: string;
}

export function FinalTest({ state, onChange, onSeek }: { state: TestState; onChange: (s: TestState) => void; onSeek: (index: number) => void }) {
  const { answers, graded, name } = state;
  const allAnswered = TEST_QUESTIONS.every((_, i) => answers[i] !== undefined);
  const score = TEST_QUESTIONS.filter((q, i) => answers[i] === q.answer).length;

  if (graded) {
    return (
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ textAlign: "center", bgcolor: "#f5f7fa", borderRadius: 3, px: 3, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              あなたの得点
            </Typography>
            <Typography sx={{ fontSize: "2.6rem", fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
              {score} / {TEST_QUESTIONS.length}
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              id="test-name"
              size="small"
              placeholder="名前を入力（提出用）"
              slotProps={{ htmlInput: { "aria-label": "名前（提出用）" } }}
              value={name}
              onChange={(e) => onChange({ ...state, name: e.target.value })}
            />
            <Typography fontWeight={700}>
              {score === TEST_QUESTIONS.length ? "全問正解です！" : score >= 6 ? "よくできました。× の問題を見直そう。" : "説明のスライドに戻って確認しよう。"}
            </Typography>
          </Stack>
        </Stack>
        <Stack spacing={0.75}>
          {TEST_QUESTIONS.map((q, i) => {
            const ok = answers[i] === q.answer;
            const review = slideIndexOf(q.review);
            return (
              <Paper key={q.question} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {ok ? <CheckCircleIcon color="success" fontSize="small" /> : <CancelIcon color="error" fontSize="small" />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {i + 1}. {q.question}
                  </Typography>
                  {!ok && (
                    <Typography variant="caption" color="text.secondary">
                      正解：{q.options[q.answer]}
                    </Typography>
                  )}
                </Box>
                {!ok && (
                  <Button size="small" onClick={() => onSeek(review)}>
                    スライド {review + 1} で確認
                  </Button>
                )}
              </Paper>
            );
          })}
        </Stack>
        <Box>
          <Button variant="outlined" onClick={() => onChange({ answers: [], graded: false, name })}>
            もう一度解く
          </Button>
        </Box>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      {TEST_QUESTIONS.map((q, i) => (
        <Box key={q.question}>
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            {i + 1}. {q.question}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {q.options.map((o, j) => (
              <Button
                key={o}
                size="small"
                variant={answers[i] === j ? "contained" : "outlined"}
                onClick={() => {
                  const next = [...answers];
                  next[i] = j;
                  onChange({ ...state, answers: next, graded: false });
                }}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {o}
              </Button>
            ))}
          </Stack>
        </Box>
      ))}
      <Box>
        <Button variant="contained" disabled={!allAnswered} onClick={() => onChange({ ...state, graded: true })}>
          採点する
        </Button>
      </Box>
    </Stack>
  );
}

"use client";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { CHAPTERS, QUIZ_COLOR, SLIDES, quizLabel, type Slide } from "@/lib/model";
import { ChoiceQuizView, FinalTest, OrderQuiz, type TestState } from "./Quizzes";
import {
  CaesarStage,
  Handwork,
  KeyCountStage,
  SummaryStage,
  TermsStage,
  WrongKeyStage,
} from "./Stages";
import PeekStage from "./PeekStage";
import TransferStage from "./TransferStage";

const chapterOf = (slide: Slide) => CHAPTERS.find((c) => c.id === slide.chapter)!;

// ---------- 上段左の図 ----------

interface StageViewProps {
  slide: Slide;
  test: TestState;
  onTest: (s: TestState) => void;
  onSeek: (i: number) => void;
  /** やってみよう（操作の課題）をクリアしたとき */
  onDone: () => void;
}

function StageView({ slide, test, onTest, onSeek, onDone }: StageViewProps) {
  const stage = slide.stage;
  switch (stage.kind) {
    case "transfer":
      return <TransferStage scene={stage.scene} onDone={onDone} />;
    case "peek":
      return <PeekStage mode={stage.mode} onDone={onDone} />;
    case "terms":
      return <TermsStage onDone={onDone} />;
    case "caesar":
      return <CaesarStage onDone={onDone} />;
    case "handwork":
      return <Handwork mode={stage.mode} text={stage.text} keyValue={stage.key} onDone={onDone} />;
    case "wrongkey":
      return <WrongKeyStage onDone={onDone} />;
    case "keycount":
      return <KeyCountStage onDone={onDone} />;
    case "summary":
      return <SummaryStage onDone={onDone} />;
    case "order":
      return <OrderQuiz onDone={onDone} />;
    case "test":
      return <FinalTest state={test} onChange={onTest} onSeek={onSeek} />;
  }
}

// ---------- スライド送り（操作バー） ----------

const slideFromRight = keyframes`
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`;

interface SlideNavProps {
  index: number;
  canNext: boolean;
  /** 次へ進めない理由 */
  blocked: "mission" | "quiz" | null;
  /** スライドのクリックで次へ進めるか（問題のスライドでは進まない） */
  clickable: boolean;
  onSeek: (index: number) => void;
}

function SlideNav({ index, canNext, blocked, clickable, onSeek }: SlideNavProps) {
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;
  const navButtonSx = { minWidth: 0, px: { xs: 1.5, sm: 2.5 }, py: 1, fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap" };

  return (
    <Paper
      elevation={6}
      sx={{
        position: "sticky",
        bottom: { xs: 8, sm: 12 },
        zIndex: 10,
        borderRadius: 3,
        px: { xs: 1, sm: 2 },
        py: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          variant="outlined"
          onClick={() => onSeek(index - 1)}
          disabled={isFirst}
          startIcon={<NavigateBeforeIcon />}
          title="前のスライド（←キー）"
          sx={navButtonSx}
        >
          前へ
        </Button>

        <Stack flex={1} minWidth={0} alignItems="center" spacing={0.5}>
          {/* スライド一覧（クリックでそのスライドへ）。四角は問題のスライド */}
          <Stack direction="row" alignItems="center" justifyContent="center" sx={{ display: { xs: "none", sm: "flex" }, gap: 0.6 }}>
            {SLIDES.map((s, i) => {
              const color = chapterOf(s).color;
              const current = i === index;
              const quiz = quizLabel(s.quiz);
              const newChapter = i > 0 && SLIDES[i - 1].chapter !== s.chapter;
              return (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  aria-label={`スライド ${i + 1}：${quiz ? `${quiz}・` : ""}${s.title}`}
                  aria-current={current ? "step" : undefined}
                  title={`${i + 1}. ${quiz ? `【${quiz}】` : ""}${s.title}`}
                  onClick={() => onSeek(i)}
                  sx={{
                    p: 0,
                    border: 0,
                    cursor: "pointer",
                    width: current ? 22 : 10,
                    height: 10,
                    borderRadius: quiz ? "2px" : 5,
                    bgcolor: color,
                    opacity: current ? 1 : i < index ? 0.55 : 0.22,
                    transition: "width 0.2s, opacity 0.2s",
                    ml: newChapter ? 1.25 : 0,
                    "&:hover": { opacity: current ? 1 : 0.8 },
                  }}
                />
              );
            })}
          </Stack>
          <Typography variant="caption" color={canNext ? "text.secondary" : "error"} sx={{ fontVariantNumeric: "tabular-nums", lineHeight: 1.2, textAlign: "center", fontWeight: canNext ? 400 : 700 }}>
            スライド {index + 1} / {SLIDES.length}
            {!canNext ? (
              <>
                　·
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {blocked === "mission" ? "「やってみよう」を" : "問題に"}
                </Box>
                {blocked === "mission" ? "クリアすると次へ進めます" : "答えると次へ進めます"}
              </>
            ) : (
              clickable && (
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  　·　画面をクリックしても次へ進みます
                </Box>
              )
            )}
          </Typography>
        </Stack>

        {isLast ? (
          <Button variant="contained" onClick={() => onSeek(0)} startIcon={<ReplayIcon />} sx={navButtonSx}>
            最初から
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => onSeek(index + 1)}
            disabled={!canNext}
            endIcon={<NavigateNextIcon />}
            title="次のスライド（→キー）"
            sx={navButtonSx}
          >
            次へ
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

// ---------- 本体 ----------

export default function SlideDeck() {
  const [index, setIndex] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  /** 選択問題の答え（スライド番号 → 選んだ選択肢） */
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [test, setTest] = useState<TestState>({ answers: [], graded: false, name: "" });
  /** やってみよう（操作の課題）をクリアしたスライド */
  const [done, setDone] = useState<Record<number, boolean>>({});
  const markDone = useCallback(() => setDone((d) => (d[index] ? d : { ...d, [index]: true })), [index]);

  const slide = SLIDES[index];
  const chapter = chapterOf(slide);
  const label = quizLabel(slide.quiz);
  const missionLeft = Boolean(slide.mission) && !done[index];
  const quizLeft = slide.quiz?.kind === "choice" && slide.quiz.gate && answers[index] === undefined;
  const canNext = !missionLeft && !quizLeft;
  // 問題や操作のあるスライドでは、クリックで次へ進めない
  const interactive = Boolean(slide.quiz || slide.mission);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
    if (clamped === index) return;
    // 予想問題は答えるまで先へ進めない
    if (clamped > index && !canNext) return;
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  };

  // スライドを変えたら、スライドの頭が見えるところまで戻す（スマホで下までスクロールしていたとき）
  useEffect(() => {
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ behavior: "smooth" });
  }, [index]);

  // パワーポイントと同じキー操作でスライドを送る
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;
      const onButton = e.target instanceof HTMLElement && e.target.closest("button, [role=button]");
      let next: number;
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") next = index + 1;
      else if ((e.key === " " || e.key === "Enter") && !onButton) next = index + 1;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Backspace") next = index - 1;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = SLIDES.length - 1;
      else return;
      e.preventDefault();
      go(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // スライド部分をクリック・タップすると次へ（問題のスライドと、ボタンなど操作できる部品は除く）
  const advanceOnClick = (e: MouseEvent) => {
    if (interactive) return;
    if (e.target instanceof HTMLElement && e.target.closest("button, a, input, [role=button]")) return;
    if (window.getSelection()?.toString()) return;
    go(index + 1);
  };

  const missionBox = slide.mission && (
    <Paper
      variant="outlined"
      sx={{ p: 1, borderWidth: 2, borderColor: done[index] ? "success.main" : "#ef6c00", bgcolor: done[index] ? "#f1f8e9" : "#fff8e1" }}
    >
      <Typography variant="caption" fontWeight={700} sx={{ color: done[index] ? "success.main" : "#ef6c00" }}>
        {done[index] ? "✅ クリア！" : "🎯 やってみよう"}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.7 }}>
        {slide.mission}
      </Typography>
    </Paper>
  );

  const textCard = (
    <Card sx={{ borderRadius: 3, display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap" useFlexGap>
          {label && (
            <Chip size="small" label={label} sx={{ fontWeight: 700, color: QUIZ_COLOR[label], border: `2px solid ${QUIZ_COLOR[label]}`, bgcolor: "transparent" }} />
          )}
          <Typography variant="caption" color="text.secondary">
            第{chapter.id}章　{chapter.name}
          </Typography>
        </Stack>
        <Typography variant="h6" fontWeight={700} mb={0.5} sx={{ fontSize: "1.15rem" }}>
          {slide.title}
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.8, fontSize: "0.95rem" }}>
          {slide.description}
        </Typography>
        {/* スマホでは、やってみようを図の上に出す */}
        {missionBox && <Box sx={{ mt: 1.5, display: { xs: "none", md: "block" } }}>{missionBox}</Box>}
        {/* 要点は、やってみようをクリアしてから見せる */}
        {slide.points && !missionLeft && (
          <Paper variant="outlined" sx={{ mt: 1.5, p: 1, borderColor: "success.main", bgcolor: "#f1f8e9" }}>
            {slide.points.map((c) => (
              <Stack key={c} direction="row" spacing={1} alignItems="flex-start" py={0.25}>
                <CheckCircleIcon color="success" fontSize="small" sx={{ mt: 0.15 }} />
                <Typography variant="body2" fontWeight={600}>
                  {c}
                </Typography>
              </Stack>
            ))}
          </Paper>
        )}
        {slide.quiz?.kind === "choice" && (
          <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderWidth: 2, borderColor: QUIZ_COLOR[label!] }}>
            <ChoiceQuizView quiz={slide.quiz} value={answers[index]} onAnswer={(v) => setAnswers({ ...answers, [index]: v })} />
          </Paper>
        )}
      </CardContent>
    </Card>
  );

  const stageCard = (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        {/* 章の目次 */}
        <Stack direction="row" spacing={0.75} mb={2} justifyContent="center" flexWrap="wrap" useFlexGap>
          {CHAPTERS.map((c) => {
            const on = c.id === slide.chapter;
            return (
              <Chip
                key={c.id}
                size="small"
                label={`${c.id}. ${c.name}`}
                sx={{ fontWeight: 700, bgcolor: on ? c.color : "transparent", color: on ? "#fff" : "text.secondary", border: `1px solid ${on ? c.color : "#cfd8dc"}` }}
              />
            );
          })}
        </Stack>
        {missionBox && <Box sx={{ mb: 1.5, display: { xs: "block", md: "none" } }}>{missionBox}</Box>}
        <StageView slide={slide} test={test} onTest={setTest} onSeek={go} onDone={markDone} />
      </CardContent>
    </Card>
  );

  return (
    <Stack spacing={2} ref={top} sx={{ scrollMarginTop: 8 }}>
      {/* 1枚のスライド */}
      <Box
        key={index}
        onClick={advanceOnClick}
        sx={{
          cursor: interactive || index === SLIDES.length - 1 ? "default" : "pointer",
          animation: `${direction === 1 ? slideFromRight : slideFromLeft} 0.35s ease-out`,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.25fr) minmax(0, 1fr)" },
          gap: 2,
          alignItems: "stretch",
          minHeight: { md: 520 },
        }}
      >
        {stageCard}
        {textCard}
      </Box>

      <SlideNav index={index} canNext={canNext} blocked={missionLeft ? "mission" : quizLeft ? "quiz" : null} clickable={!interactive} onSeek={go} />
    </Stack>
  );
}

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import { LevelBadge } from "../components/common/Chip.jsx";
import { Skeleton, ResultFlag, EmptyState } from "../components/common/Feedback.jsx";
import ListenButton from "../components/common/ListenButton.jsx";
import WritingPad from "../components/WritingPad.jsx";
import Quiz, { shuffle, makeOptions } from "../components/Quiz.jsx";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import numbers from "../data/numbers.json";
import { useProfile, setLesson, toggleKnown, record } from "../lib/progress.js";
import { lessonById } from "../lib/roadmap.js";
import { useToast } from "../components/common/Toast.jsx";

const toKata = (s) =>
  [...s]
    .map((c) => {
      const n = c.charCodeAt(0);
      return n >= 0x3041 && n <= 0x3096 ? String.fromCharCode(n + 0x60) : c;
    })
    .join("");

function kanaItems(lesson) {
  const g = kanaGroups.find((x) => x.id === lesson.group) || kanaGroups[0];
  const ks = g.k.split(" ");
  const rs = g.r.split(" ");
  return ks.map((c, i) => {
    if (c === "_") return null;
    const jp = lesson.script === "kata" ? toKata(c) : c;
    return { id: `${lesson.script}-${g.id}-${i}`, jp, romaji: rs[i] };
  }).filter(Boolean);
}

function kanjiItems(lesson) {
  const [a, b] = lesson.range || [0, 0];
  return kanjiList.slice(a, b).map((w) => ({ id: String(w.id), jp: w.k, vi: w.m, on: w.on, kun: w.kun, h: w.h }));
}

function vocabItems(lesson) {
  const [a, b] = lesson.range || [0, 0];
  return vocabList.slice(a, b).map((w) => ({
    id: String(w.id),
    jp: w.kanji || w.kana.split("/")[0].trim(),
    kana: w.kana,
    vi: w.vi,
  }));
}

function numItems(lesson) {
  if (lesson.subset === "days") {
    return Object.entries(numbers.DAYS).map(([n, reading]) => ({
      id: `days-${n}`,
      jp: `${n}日`,
      reading,
      vi: `ngày ${n} (đọc đặc biệt)`,
      special: true,
    }));
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
    id: `n-${n}`,
    jp: numbers.KD[n] || String(n),
    reading: numbers.D[n],
    vi: String(n),
  }));
}

function buildItems(lesson) {
  if (lesson.kind === "kana") return kanaItems(lesson);
  if (lesson.kind === "kanji") return kanjiItems(lesson);
  if (lesson.kind === "vocab") return vocabItems(lesson);
  if (lesson.kind === "num") return numItems(lesson);
  return [];
}

function buildQuiz(lesson, items) {
  const sample = shuffle(items).slice(0, Math.min(5, items.length));
  return sample.map((it) => {
    if (lesson.kind === "kana") {
      const pool = items.map((x) => x.romaji);
      const { options, answer } = makeOptions(it.romaji, pool);
      return {
        section: "kana",
        key: it.id,
        prompt: "Ký tự này đọc là gì?",
        sub: it.jp,
        options,
        answer,
        explain: `${it.jp} đọc là “${it.romaji}”.`,
      };
    }
    if (lesson.kind === "kanji") {
      const pool = items.map((x) => x.vi);
      const { options, answer } = makeOptions(it.vi, pool);
      return {
        section: "kanji",
        key: it.id,
        prompt: "Chữ này có nghĩa là gì?",
        sub: it.jp,
        options,
        answer,
        explain: `${it.jp} (${it.h || ""}) — ${it.vi}.`,
      };
    }
    if (lesson.kind === "vocab") {
      const pool = items.map((x) => x.vi);
      const { options, answer } = makeOptions(it.vi, pool);
      return {
        section: "vocab",
        key: it.id,
        prompt: "Từ này có nghĩa là gì?",
        sub: it.jp,
        options,
        answer,
        explain: `${it.jp} (${it.kana}) — ${it.vi}.`,
      };
    }
    const pool = items.map((x) => x.reading);
    const { options, answer } = makeOptions(it.reading, pool);
    return {
      section: "num",
      key: it.id,
      prompt: it.special ? "Ngày này đọc là gì?" : "Số này đọc bằng tiếng Nhật là gì?",
      sub: it.jp,
      options,
      answer,
      explain: `${it.jp} — ${it.reading}.`,
    };
  });
}

const STEPS = ["theory", "practice", "result"];
const KANA_STEPS = ["theory", "write", "practice", "result"];
const STEP_LABEL = { theory: "Lý thuyết", write: "Viết", practice: "Luyện tập", result: "Kết quả" };

/**
 * Bài học: Lý thuyết → (Viết nếu là bài kana) → Luyện tập → Kết quả.
 * Thanh bước ở trên, nút chính "Tiếp tục" cố định phía dưới khối nội dung.
 */
export default function Lesson({ lessonId, go }) {
  const p = useProfile();
  const toast = useToast();
  const lesson = lessonById(lessonId);
  const [step, setStep] = useState("theory");
  const [quizResult, setQuizResult] = useState(null);
  const [writeIdx, setWriteIdx] = useState(0);

  // App.jsx không key Lesson theo lessonId → tự về đầu khi đổi bài
  useEffect(() => {
    setStep("theory");
    setQuizResult(null);
    setWriteIdx(0);
  }, [lessonId]);

  const items = useMemo(() => (lesson ? buildItems(lesson) : []), [lesson]);
  const questions = useMemo(() => (lesson && items.length ? buildQuiz(lesson, items) : []), [lesson, items]);

  if (!lesson) {
    return (
      <EmptyState
        title="Không tìm thấy bài học"
        hint="Bài này có thể đã bị đổi tên. Quay lại lộ trình để chọn bài khác."
        actionLabel="Về Lộ trình"
        onAction={() => go("#/roadmap")}
      />
    );
  }

  if (!items.length) {
    return <Skeleton lines={4} />;
  }

  const steps = lesson.kind === "kana" ? KANA_STEPS : STEPS;
  const stepNow = steps.includes(step) ? step : "theory";
  const stepIdx = steps.indexOf(stepNow);
  const knownKey = lesson.kind === "kanji" ? "kanji" : lesson.kind === "vocab" ? "vocab" : null;

  const markAllKnown = () => {
    items.forEach((it) => {
      if (knownKey && !p.known[knownKey]?.[it.id]) toggleKnown(knownKey, it.id);
    });
    toast.show("Đã đánh dấu các mục trong bài là đã biết.");
  };

  const finish = (score, total) => {
    setQuizResult({ score, total });
    setLesson(lesson.id, { done: score >= Math.ceil(total * 0.6), score, total, at: Date.now() });
    setStep("result");
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go("#/roadmap")}
          aria-label="Quay lại lộ trình"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--brand)]"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[var(--fs-h2)] font-bold">{lesson.title}</h1>
            <LevelBadge level={lesson.level} />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Bước {stepIdx + 1}/{steps.length} · {STEP_LABEL[stepNow]}
          </p>
        </div>
      </div>
      <ProgressBar value={stepIdx + 1} max={steps.length} label="Tiến độ bài" className="mb-5" />

      {stepNow === "theory" && (
        <div className="fade-in space-y-4">
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{lesson.summary}</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {items.slice(0, 24).map((it) => (
              <div
                key={it.id}
                className="flex flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-1 py-3"
              >
                <span lang="ja" className="ja-display text-2xl font-bold text-[var(--text)]">
                  {it.jp}
                </span>
                <span className="romaji mt-1 text-center leading-tight">
                  {it.romaji || it.reading || it.h || ""}
                </span>
                <ListenButton text={it.jp} size="sm" className="mt-1.5" label={`Nghe ${it.jp}`} />
              </div>
            ))}
          </div>
          {items.length > 24 && (
            <p className="text-xs text-[var(--text-muted)]">
              Hiển thị 24/{items.length} mục — xem đầy đủ ở Thư viện.
            </p>
          )}
          {knownKey && (
            <Button variant="secondary" onClick={markAllKnown} className="w-full">
              Đánh dấu cả bài là đã biết
            </Button>
          )}
          <Button onClick={() => setStep(steps[1])} className="w-full sm:w-auto">
            Tiếp tục — {STEP_LABEL[steps[1]]}
          </Button>
        </div>
      )}

      {stepNow === "write" && (
        <div className="fade-in">
          <p className="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Chọn chữ rồi viết lên khung theo chữ mờ. Bấm “Kiểm tra bài viết” để xem độ khớp.
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {items.map((it, i) => {
              const best = (p.write || {})[it.jp] || 0;
              const on = i === (writeIdx < items.length ? writeIdx : 0);
              return (
                <button
                  key={it.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setWriteIdx(i)}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border text-xl transition duration-150 active:scale-95 ${
                    on
                      ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--brand)]"
                  }`}
                >
                  <span lang="ja" className="ja-display font-bold">
                    {it.jp}
                  </span>
                  {best >= 60 && (
                    <span aria-hidden="true" className="absolute -right-1 -top-1 text-[10px] text-[var(--success)]">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <WritingPad
            key={items[Math.min(writeIdx, items.length - 1)]?.jp}
            glyph={items[Math.min(writeIdx, items.length - 1)]?.jp || ""}
            reading={items[Math.min(writeIdx, items.length - 1)]?.romaji || ""}
            className="mx-auto max-w-md"
          />
          <Button onClick={() => setStep("practice")} className="mt-5 w-full sm:w-auto">
            Tiếp tục — Luyện tập
          </Button>
        </div>
      )}

      {stepNow === "practice" && (
        <div className="fade-in">
          <Quiz
            questions={questions}
            title={`Luyện tập · ${lesson.title}`}
            onExit={() => setStep(steps[steps.indexOf("practice") - 1])}
            onAnswer={(q, correct) => record(q.section, q.key, correct)}
            onDone={({ score, total }) => finish(score, total)}
          />
        </div>
      )}

      {stepNow === "result" && quizResult && (
        <Card className="fade-in !p-5">
          <ResultFlag ok={quizResult.score >= Math.ceil(quizResult.total * 0.6)} label={quizResult.score >= Math.ceil(quizResult.total * 0.6) ? "Hoàn thành bài" : "Cần ôn thêm"} />
          <p className="mt-4 text-[var(--fs-h1)] font-bold">
            {quizResult.score}/{quizResult.total} câu đúng
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Đúng từ 60% là bài được đánh dấu hoàn thành. Bạn có thể ôn lại bất cứ lúc nào ở Lộ trình.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => go("#/roadmap")} className="flex-1">
              <Check aria-hidden="true" className="h-4 w-4" />
              Về Lộ trình
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setQuizResult(null);
                setStep("practice");
              }}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Luyện lại
            </Button>
          </div>
          <p className="mt-4 text-[var(--fs-tiny)] text-[var(--text-faint)]">
            Ghi nhận câu đúng/sai vào thống kê để gợi ý ôn tập.
          </p>
        </Card>
      )}
    </div>
  );
}

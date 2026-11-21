import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  AlertTriangle,
  Timer,
  CheckSquare,
  WifiOff,
  Clock,
  HelpCircle,
  Check,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Send,
  X,
} from "lucide-react";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import { LevelBadge } from "../components/common/Chip.jsx";
import { shuffle, makeOptions } from "../components/Quiz.jsx";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import numbers from "../data/numbers.json";
import grammarList from "../data/grammar.json";
import { record, flushPending } from "../lib/progress.js";
import { formatCountdown, gradeExam } from "../lib/uiHelpers.js";

const cx = (...a) => a.filter(Boolean).join(" ");

const N = 20;
const EXAM_SECONDS = 25 * 60;
const OPTION_LETTERS = ["A", "B", "C", "D"];
const SECTION_LABELS = {
  kana: "Chữ cái",
  kanji: "Hán tự",
  vocab: "Từ vựng",
  num: "Số đếm",
  grammar: "Ngữ pháp",
};

function kanaPool() {
  const out = [];
  kanaGroups.forEach((g) => {
    const ks = g.k.split(" ");
    const rs = g.r.split(" ");
    ks.forEach((c, i) => {
      if (c === "_") return;
      out.push({ jp: c, romaji: rs[i] });
    });
  });
  return out;
}

function buildTest() {
  const kanas = shuffle(kanaPool()).slice(0, 4);
  const kanjis = shuffle(kanjiList.filter((k) => k.id < 500)).slice(0, 4);
  const vocabs = shuffle(vocabList).slice(0, 4);
  const dayEntries = Object.entries(numbers.DAYS);
  const nums = shuffle(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
      jp: numbers.KD[n] || (n === 10 ? "十" : String(n)),
      reading: numbers.D[n] || (n === 10 ? "じゅう" : ""),
      vi: String(n),
    }))
  ).slice(0, 2);
  const days = shuffle(
    dayEntries.map(([n, reading]) => ({ jp: `${n}日`, reading, vi: `ngày ${n}` }))
  ).slice(0, 2);
  const grammars = shuffle(grammarList).slice(0, 4);

  const qs = [];

  kanas.forEach((k) => {
    const pool = kanaPool().map((x) => x.romaji);
    const { options, answer } = makeOptions(k.romaji, pool);
    qs.push({
      section: "kana",
      sectionLabel: "Chữ cái · Kana",
      prompt: "Ký tự này đọc là gì?",
      sub: k.jp,
      options,
      answer,
      explain: `${k.jp} đọc là “${k.romaji}”.`,
      key: k.jp,
    });
  });

  kanjis.forEach((w) => {
    const pool = kanjiList.filter((x) => x.id < 500).map((x) => x.m);
    const { options, answer } = makeOptions(w.m, pool);
    qs.push({
      section: "kanji",
      sectionLabel: "Hán tự · Kanji",
      prompt: "Chữ Hán này có nghĩa là gì?",
      sub: w.k,
      options,
      answer,
      explain: `${w.k} (${w.h}) — ${w.m}.`,
      key: String(w.id),
    });
  });

  vocabs.forEach((w) => {
    const main = w.kanji || w.kana.split("/")[0].trim();
    const pool = vocabList.map((x) => x.vi);
    const { options, answer } = makeOptions(w.vi, pool);
    qs.push({
      section: "vocab",
      sectionLabel: "Từ vựng · N5",
      prompt: "Từ này có nghĩa là gì?",
      sub: main,
      hintSub: w.kanji ? w.kana : "",
      options,
      answer,
      explain: `${main} (${w.kana}) — ${w.vi}.`,
      key: String(w.id),
    });
  });

  [...nums, ...days].forEach((it) => {
    const pool = [...nums, ...days].map((x) => x.reading);
    const { options, answer } = makeOptions(it.reading, pool);
    qs.push({
      section: "num",
      sectionLabel: "Số đếm & Ngày tháng",
      prompt: "Cách đọc tiếng Nhật đúng của từ này là gì?",
      sub: it.jp,
      options,
      answer,
      explain: `${it.jp} — ${it.reading}.`,
      key: it.jp,
    });
  });

  grammars.forEach((g) => {
    const pool = grammarList.map((x) => x.pat);
    const { options, answer } = makeOptions(g.pat, pool);
    qs.push({
      section: "grammar",
      sectionLabel: "Ngữ pháp · N5",
      prompt: "Ví dụ sau sử dụng cấu trúc ngữ pháp nào?",
      sub: g.ex,
      hintSub: g.vi,
      options,
      answer,
      explain: `${g.pat} (${g.name}) — ${g.mean}`,
      key: String(g.id),
    });
  });

  return shuffle(qs).slice(0, N);
}

/**
 * Luyện đề thi N5 — Màn hình chờ, không gian làm bài với đồng hồ đếm ngược + bảng 20 câu, và màn kết quả chi tiết.
 */
export default function Test() {
  const [mode, setMode] = useState("idle");
  const [seed, setSeed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);
  const [result, setResult] = useState(null);

  const questions = useMemo(() => buildTest(), [seed]);

  const startExam = () => {
    setResult(null);
    setAnswers({});
    setCurrentIdx(0);
    setSecondsLeft(EXAM_SECONDS);
    setSeed((s) => s + 1);
    setMode("running");
  };

  const submitExam = (currentAnswers = answers) => {
    flushPending();
    questions.forEach((q, idx) => {
      if (currentAnswers[idx] !== undefined && currentAnswers[idx] !== null) {
        record(q.section, q.key, currentAnswers[idx] === q.answer);
      }
    });
    const graded = gradeExam(questions, currentAnswers);
    setResult({ ...graded, answers: { ...currentAnswers } });
    setMode("done");
  };

  useEffect(() => {
    if (mode !== "running") return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  useEffect(() => {
    if (mode === "running" && secondsLeft === 0) {
      submitExam(answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, secondsLeft]);

  /* ---------------- Màn hình chờ (Idle) ---------------- */
  if (mode === "idle") {
    const sections = [
      { label: "Chữ cái Kana", count: "4 câu", desc: "Hiragana & Katakana" },
      { label: "Hán tự N5", count: "4 câu", desc: "Ý nghĩa & cách dùng" },
      { label: "Từ vựng", count: "4 câu", desc: "Từ vựng thông dụng" },
      { label: "Số đếm & Ngày", count: "4 câu", desc: "Biến âm đặc biệt" },
      { label: "Ngữ pháp", count: "4 câu", desc: "Trợ từ & cấu trúc câu" },
    ];

    return (
      <div className="space-y-6">
        <header className="hero-in hero-in-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="eyebrow text-[var(--brand-deep)]">Bài thi thử mô phỏng N5</p>
            <LevelBadge level="N5" />
          </div>
          <h1 className="font-display mt-1.5 text-[var(--fs-h1)] font-semibold text-[var(--text)]">
            Luyện đề thi N5
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-muted)]">
            20 câu trắc nghiệm tổng hợp kiến thức nền tảng. Mỗi lần bắt đầu hệ thống sẽ tạo một đề ngẫu nhiên mới.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
          {/* Card Metadata đề thi */}
          <Card className="hero-in hero-in-2 flex flex-col justify-between bg-[var(--surface)] lg:col-span-7">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow text-[var(--brand-deep)]">Đề chuẩn N5</span>
                <LevelBadge level="N5" />
              </div>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[var(--text)]">
                Đề N5 · Tổng hợp 20 câu
              </h2>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Timer aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />
                  25 phút
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckSquare aria-hidden="true" className="h-4 w-4 text-[var(--success)]" />
                  20 câu hỏi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <WifiOff aria-hidden="true" className="h-4 w-4 text-[var(--outline)]" />
                  Không cần mạng
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {sections.map((s) => (
                  <div key={s.label} className="rounded-xl bg-[var(--surface-low)] p-3">
                    <p className="text-xs font-bold text-[var(--text)]">{s.label}</p>
                    <p className="tabular text-xs font-semibold text-[var(--brand-deep)]">{s.count}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)]/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[var(--text-muted)]">
                Điểm chỉ dùng để theo dõi tiến độ nội bộ, không phải chứng chỉ JLPT chính thức.
              </p>
              <Button onClick={startExam} className="shrink-0">
                Bắt đầu làm 20 câu
              </Button>
            </div>
          </Card>

          <Card className="hero-in hero-in-3 flex flex-col justify-between bg-[var(--surface-low)] lg:col-span-5">
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-deep)]">
                <Trophy aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text)]">Cách chấm &amp; gợi ý ôn</h3>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                <li>• Chọn đáp án trực tiếp và nhảy nhanh giữa 20 câu bất cứ lúc nào.</li>
                <li>• Câu trả lời sai sẽ tự động thêm vào hàng đợi Ôn tập SRS.</li>
                <li>• Sau khi nộp bài, hệ thống chỉ ra phần kỹ năng cần củng cố thêm.</li>
              </ul>
            </div>
            <p className="mt-4 text-xs font-medium text-[var(--outline)]">
              Mẹo: Làm xong toàn bộ 20 câu trước khi bấm Nộp bài để đánh giá sát nhất.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------------- Màn hình Kết quả (Done) ---------------- */
  if (mode === "done" && result) {
    const weak = Object.entries(result.bySection)
      .map(([sec, v]) => ({ sec, ...v, acc: v.total ? v.ok / v.total : 0 }))
      .filter((x) => x.acc < 0.7)
      .sort((a, b) => a.acc - b.acc);

    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
              <Trophy aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow text-[var(--brand-deep)]">Kết quả bài luyện</p>
              <h1 className="font-display text-[var(--fs-h1)] font-semibold text-[var(--text)]">
                Hoàn thành đề N5
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Điểm nội bộ, chỉ tham khảo — không phải chứng chỉ JLPT.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => (window.location.hash = "#/library")}>
              Mở Thư viện
            </Button>
            <Button onClick={startExam}>Làm lại đề mới</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-5">
            <p className="eyebrow text-[var(--outline)]">Tổng điểm</p>
            <p className="display tabular mt-2 text-[var(--brand-deep)]">
              {result.score}/{result.total}
            </p>
            <ProgressBar value={result.score} max={result.total} label="Số câu đúng" className="mt-4" />

            <div className="mt-5 space-y-2.5 border-t border-[var(--border)]/60 pt-4">
              {Object.entries(result.bySection).map(([sec, v]) => (
                <div key={sec} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{SECTION_LABELS[sec] || sec}</span>
                  <span className="tabular font-bold text-[var(--text)]">
                    {v.ok}/{v.total}
                  </span>
                </div>
              ))}
            </div>

            {weak.length > 0 && (
              <div className="mt-5 rounded-xl bg-[var(--warning-soft)] p-3.5 text-sm text-[var(--warning)]">
                <p className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
                  Cần ôn thêm
                </p>
                <ul className="mt-1.5 space-y-1 text-xs">
                  {weak.map((w) => (
                    <li key={w.sec}>
                      • {SECTION_LABELS[w.sec] || w.sec}: {w.ok}/{w.total} câu đúng
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="lg:col-span-7">
            <h2 className="text-[var(--fs-h3)] font-bold text-[var(--text)]">Chi tiết từng câu</h2>
            <ul className="mt-4 space-y-2.5">
              {questions.map((q, idx) => {
                const userPick = result.answers[idx];
                const ok = userPick === q.answer;
                return (
                  <li
                    key={`${q.section}-${q.key}-${idx}`}
                    className="flex items-start justify-between gap-3 rounded-xl bg-[var(--surface-low)] p-3.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular text-xs font-bold text-[var(--outline)]">
                          Câu {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{q.sectionLabel}</span>
                      </div>
                      <p lang="ja" className="mt-1 font-semibold text-[var(--text)]">
                        {q.sub}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        Đáp án đúng: <strong className="text-[var(--success)]">{q.options[q.answer]}</strong>
                        {userPick !== undefined && !ok && (
                          <span className="ml-2 text-[var(--danger)]">
                            (Bạn chọn: {q.options[userPick]})
                          </span>
                        )}
                        {userPick === undefined && (
                          <span className="ml-2 text-[var(--text-faint)]">(Chưa trả lời)</span>
                        )}
                      </p>
                    </div>
                    <span
                      aria-label={ok ? "Đúng" : "Chưa đúng"}
                      className={cx(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        ok
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : "bg-[var(--danger-soft)] text-[var(--danger)]"
                      )}
                    >
                      {ok ? <Check aria-hidden="true" className="h-4 w-4" /> : <X aria-hidden="true" className="h-4 w-4" />}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    );
  }

  /* ---------------- Màn hình Làm bài (Running) ---------------- */
  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const pct = Math.round((answeredCount / questions.length) * 100);
  const remaining = questions.length - answeredCount;
  const selectedOpt = answers[currentIdx];

  return (
    <div className="space-y-5">
      {/* 1. Header Card + Exam Status & Progress */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
        <Card className="flex flex-col justify-between !p-4 sm:!p-5 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow text-[var(--brand-deep)]">Bài thi thử mô phỏng N5</span>
            <LevelBadge level="N5" />
          </div>
          <h1 className="font-display mt-1.5 text-xl font-semibold text-[var(--text)] sm:text-2xl">
            Đề N5 · Tổng hợp 20 câu
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Timer aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand)]" />
              25 phút
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckSquare aria-hidden="true" className="h-3.5 w-3.5 text-[var(--success)]" />
              20 câu hỏi
            </span>
            <span className="inline-flex items-center gap-1">
              <WifiOff aria-hidden="true" className="h-3.5 w-3.5 text-[var(--outline)]" />
              Offline
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between !p-4 sm:!p-5 lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Câu hỏi
              </span>
              <span className="font-display tabular text-3xl font-bold text-[var(--text)]">
                {String(currentIdx + 1).padStart(2, "0")}
              </span>
              <span className="tabular text-sm text-[var(--outline)]">/ {questions.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-2)] px-3 py-1.5">
                <Clock aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />
                <span className="tabular text-sm font-bold text-[var(--brand-deep)]">
                  {formatCountdown(secondsLeft)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="min-h-9 rounded-xl px-2.5 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                Thoát
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--brand-deep)] transition-[width] duration-300"
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="tabular">Đã trả lời {pct}%</span>
              <span className="tabular font-medium text-[var(--success)]">Còn {remaining} câu</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Main Split: Question Workspace (8 cols) + Quick Palette 1-20 (4 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        <Card className="space-y-5 lg:col-span-8">
          <div className="flex items-center gap-2 text-[var(--brand-deep)]">
            <HelpCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wide">{q.sectionLabel}</span>
          </div>

          <p className="text-[15px] font-medium text-[var(--text)]">{q.prompt}</p>

          {/* Japanese Prompt Box */}
          <div className="relative overflow-hidden rounded-xl bg-[var(--surface-low)] px-5 py-6 text-center">
            <p
              lang="ja"
              className={cx(
                "ja-display font-semibold leading-relaxed text-[var(--text)]",
                q.sub.length <= 4
                  ? "text-4xl sm:text-5xl"
                  : q.sub.length <= 12
                    ? "text-2xl sm:text-3xl"
                    : "text-xl sm:text-2xl"
              )}
            >
              {q.sub}
            </p>
            {q.hintSub && (
              <p className="mt-2 text-xs italic text-[var(--outline)]">{q.hintSub}</p>
            )}
          </div>

          {/* Options A B C D */}
          <fieldset className="space-y-2.5">
            <legend className="sr-only">Danh sách đáp án câu {currentIdx + 1}</legend>
            {q.options.map((opt, optIdx) => {
              const selected = selectedOpt === optIdx;
              return (
                <label
                  key={optIdx}
                  className={cx(
                    "flex min-h-[54px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors duration-150",
                    selected
                      ? "border-[var(--brand)]/40 bg-[var(--brand-soft)] text-[var(--brand-deep)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-low)]"
                  )}
                >
                  <input
                    type="radio"
                    name={`n5_question_${currentIdx}`}
                    checked={selected}
                    onChange={() => setAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }))}
                    className="sr-only"
                  />
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className={cx(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        selected
                          ? "bg-[var(--brand)] text-[var(--on-brand)]"
                          : "bg-[var(--surface-high)] text-[var(--text)]"
                      )}
                    >
                      {OPTION_LETTERS[optIdx]}
                    </span>
                    <span className={cx("min-w-0 break-words text-base", selected ? "font-semibold" : "font-normal")}>
                      {opt}
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      selected
                        ? "bg-[var(--brand)] text-[var(--on-brand)]"
                        : "bg-[var(--surface-highest)]"
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {/* Navigation actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="soft"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="flex-1"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              <span>Câu trước</span>
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="flex-1"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => submitExam()} className="flex-1">
                <Send aria-hidden="true" className="h-4 w-4" />
                <span>Nộp bài</span>
              </Button>
            )}
          </div>
        </Card>

        {/* Quick Palette: Bảng 20 câu */}
        <aside className="lg:col-span-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LayoutGrid aria-hidden="true" className="h-4 w-4 text-[var(--text-muted)]" />
                <h2 className="text-base font-bold text-[var(--text)]">Bảng câu hỏi</h2>
              </div>
              <span className="tabular text-xs font-semibold text-[var(--success)]">
                Đã trả lời {answeredCount}/{questions.length}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              {questions.map((_, idx) => {
                const isActive = idx === currentIdx;
                const isDone = answers[idx] !== undefined && answers[idx] !== null;
                return (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Câu ${idx + 1}${isActive ? " (đang chọn)" : isDone ? " (đã làm)" : " (chưa làm)"}`}
                    onClick={() => setCurrentIdx(idx)}
                    className={cx(
                      "tabular flex h-10 items-center justify-center rounded-lg text-xs font-bold transition",
                      isActive
                        ? "bg-[var(--brand)] text-[var(--on-brand)] ring-2 ring-[var(--brand)] ring-offset-2 ring-offset-[var(--surface)]"
                        : isDone
                          ? "bg-[var(--success)] text-[var(--on-brand)]"
                          : "bg-[var(--surface-low)] font-medium text-[var(--text-muted)] hover:bg-[var(--surface-high)]"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)]/60 pt-3 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
                Đã làm ({answeredCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
                Đang chọn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--surface-highest)]" />
                Chưa làm ({remaining})
              </span>
            </div>

            <Button onClick={() => submitExam()} className="w-full">
              <Send aria-hidden="true" className="h-4 w-4" />
              <span>Nộp bài ({answeredCount}/{questions.length} câu)</span>
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}

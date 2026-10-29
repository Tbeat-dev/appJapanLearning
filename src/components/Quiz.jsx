import { useEffect, useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import Button from "./common/Button.jsx";
import StepDots from "./common/StepDots.jsx";
import { ResultFlag } from "./common/Feedback.jsx";
import { flushPending } from "../lib/progress.js";

const cx = (...a) => a.filter(Boolean).join(" ");

/**
 * Trắc nghiệm: câu hỏi khớp loại đáp án.
 * q: { section, prompt, sub, options: string[], answer: number, explain }
 */
export default function Quiz({ questions, title, onDone, onExit, onAnswer }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);

  const total = questions.length;
  const q = questions[idx];
  const answered = picked !== null;
  const ok = answered && picked === q?.answer;

  const finish = (all) => {
    const score = all.filter((r) => r).length;
    onDone?.({ score, total, results: all });
  };

  useEffect(() => {
    if (!questions.length) onDone?.({ score: 0, total: 0, results: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const next = () => {
    flushPending();
    if (idx + 1 >= total) {
      finish(results);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  };

  const pick = (i) => {
    if (answered || !q) return;
    setPicked(i);
    const correct = i === q.answer;
    onAnswer?.(q, correct);
    setResults((r) => {
      const n = [...r];
      n[idx] = correct;
      return n;
    });
  };

  if (!q) return null;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="sr-only">
          Câu {idx + 1}/{total}
        </span>
        <StepDots value={idx + (answered ? 1 : 0)} max={total} className="flex-1 justify-center" />
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="shrink-0 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--brand)]"
          >
            Thoát
          </button>
        )}
      </div>

      {title && <p className="mb-2 text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>}

      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
        <p className="text-sm font-medium text-[var(--text-muted)]">{q.prompt}</p>
        {q.sub && (
          <p lang="ja" className="ja-display mt-3 text-center text-[var(--fs-display)] font-bold text-[var(--text)]">
            {q.sub}
          </p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Các đáp án">
        {q.options.map((opt, i) => {
          const isAns = i === q.answer;
          const isPick = i === picked;
          let cls =
            "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--brand)]";
          if (answered && isAns) cls = "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]";
          else if (answered && isPick) cls = "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]";
          else if (answered) cls = "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-faint)]";
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={answered}
              className={cx(
                "flex min-h-[56px] w-full items-center gap-2 rounded-[var(--radius-md)] border-2 px-4 py-3 text-left text-[15px] font-semibold transition duration-150",
                cls
              )}
            >
              {answered && isAns && <Check aria-hidden="true" className="h-5 w-5 shrink-0" />}
              {answered && isPick && !isAns && <X aria-hidden="true" className="h-5 w-5 shrink-0" />}
              <span className="min-w-0 flex-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          aria-live="polite"
          className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
          style={{ animation: "fade-up 0.18s ease-out both" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <ResultFlag ok={ok} />
            <p className="min-w-0 flex-1 text-sm text-[var(--text-muted)]">
              {ok ? "Chính xác!" : `Gần đúng rồi. Đáp án đúng: `}
              {!ok && <strong className="text-[var(--text)]">{q.options[q.answer]}</strong>}
              {q.explain ? ` — ${q.explain}` : ""}
            </p>
          </div>
          <Button onClick={next} className="mt-4 w-full sm:w-auto">
            {idx + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Trộn mảng có seed ngẫu nhiên đơn giản. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tạo 4 lựa chọn: 1 đúng + 3 sai, không lặp. */
export function makeOptions(correct, pool) {
  const seen = new Set([String(correct)]);
  const distractors = [];
  for (const c of shuffle(pool)) {
    const s = String(c);
    if (!seen.has(s)) {
      seen.add(s);
      distractors.push(s);
      if (distractors.length >= 3) break;
    }
  }
  const options = shuffle([String(correct), ...distractors]);
  return { options, answer: options.indexOf(String(correct)) };
}

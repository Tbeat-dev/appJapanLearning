import { Check, Clock, ChevronRight, Lock } from "lucide-react";
import Button from "../components/common/Button.jsx";
import { LevelBadge } from "../components/common/Chip.jsx";
import { EmptyState } from "../components/common/Feedback.jsx";
import { useProfile } from "../lib/progress.js";
import { LESSONS, lessonDone, softLocked, lessonById, lessonProgressRatio, nextLesson } from "../lib/roadmap.js";

const cx = (...a) => a.filter(Boolean).join(" ");

/**
 * Lộ trình — ba cấp, mỗi bài một hàng có dấu hoàn thành, tên, thời lượng.
 * Bài khóa mềm: "Nên học sau khi xong X", không làm xám bài.
 */
export default function Roadmap({ go }) {
  const p = useProfile();

  if (!LESSONS.length) {
    return (
      <EmptyState
        title="Chưa có bài nào"
        hint="Dữ liệu lộ trình đang được nạp lại."
        actionLabel="Về Hôm nay"
        onAction={() => go("#/")}
      />
    );
  }

  const next = nextLesson(p);

  return (
    <div className="space-y-5">
      <header className="hero-in hero-in-1">
        <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Lộ trình
        </p>
        <h1 className="mt-1 text-[var(--fs-h1)] font-bold">JLPT N5</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          Học theo thứ tự. Bài sau gợi ý học khi bạn đã nắm ~40% bài trước — vẫn mở nếu bạn muốn thử.
        </p>
      </header>

      {next && (
        <div className="hero-in hero-in-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--brand-soft)] p-4">
          <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--brand)]">
            Tiếp theo
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[var(--fs-h3)] font-bold text-[var(--text)]">{next.title}</p>
              <p className="text-sm text-[var(--text-muted)]">{next.summary}</p>
            </div>
            <Button onClick={() => go(`#/lesson/${next.id}`)}>
              Học bài này
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <section aria-label="Danh sách bài N5">
        <ul className="space-y-2">
          {LESSONS.map((l, idx) => {
            const done = lessonDone(p, l.id);
            const locked = softLocked(p, l);
            const prev = locked ? lessonById(l.after) : null;
            const ratio = lessonProgressRatio(p, l);
            return (
              <li
                key={l.id}
                className="fade-up"
                style={{ animationDelay: `${Math.min(idx, 9) * 0.05}s` }}
              >
                <a
                  href={`#/lesson/${l.id}`}
                  className={cx(
                    "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-1)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[var(--shadow-2)] active:scale-[0.995]"
                  )}
                >
                  <span
                    aria-label={done ? "Đã hoàn thành" : "Chưa hoàn thành"}
                    className={cx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border",
                      done
                        ? "border-transparent bg-[var(--success-soft)] text-[var(--success)]"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]"
                    )}
                  >
                    {done ? (
                      <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                    ) : (
                      <span aria-hidden="true" className="text-sm font-bold">
                        {l.kind === "kana" ? "あ" : l.kind === "kanji" ? "漢" : l.kind === "num" ? "数" : "語"}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold text-[var(--text)]">{l.title}</span>
                      <LevelBadge level={l.level} />
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="h-3.5 w-3.5" /> {l.mins} phút
                      </span>
                      {locked && prev && (
                        <span className="inline-flex items-center gap-1 text-[var(--warning)]">
                          <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                          Nên học sau khi xong “{prev.title}”
                        </span>
                      )}
                      {!locked && ratio > 0 && !done && (
                        <span>Đã nắm ~{Math.round(ratio * 100)}%</span>
                      )}
                      {done && <span className="text-[var(--success)]">Đã hoàn thành</span>}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--text-faint)]" />
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

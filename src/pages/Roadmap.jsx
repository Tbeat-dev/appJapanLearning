import { useMemo, useState } from "react";
import { Check, Clock, ChevronRight, Lock, Zap, Compass } from "lucide-react";
import Button from "../components/common/Button.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import { LevelBadge } from "../components/common/Chip.jsx";
import { EmptyState } from "../components/common/Feedback.jsx";
import { useProfile } from "../lib/progress.js";
import {
  LESSONS,
  lessonDone,
  softLocked,
  lessonById,
  lessonProgressRatio,
  nextLesson,
} from "../lib/roadmap.js";
import {
  ROADMAP_CATEGORIES,
  filterLessonsByCategory,
  countLessonsByCategory,
} from "../lib/uiHelpers.js";

const cx = (...a) => a.filter(Boolean).join(" ");

const KIND_ICON = { kana: "あ", kanji: "漢", num: "数", vocab: "語", grammar: "文" };

function emblemStyle(kind, done) {
  if (done) return "bg-[var(--success-soft)] text-[var(--success)]";
  if (kind === "kana") return "bg-[var(--brand-soft)] text-[var(--brand)]";
  if (kind === "kanji") return "bg-[var(--n5-soft)] text-[var(--n5)]";
  if (kind === "vocab") return "bg-[var(--info-soft)] text-[var(--info)]";
  if (kind === "grammar") return "bg-[var(--n3-soft)] text-[var(--n3)]";
  return "bg-[var(--surface-2)] text-[var(--text-muted)]";
}

/**
 * Lộ trình — JLPT N5 từng bước với lọc phân loại, gợi ý bài tiếp theo và lưới 2 cột trên desktop.
 */
export default function Roadmap({ go }) {
  const p = useProfile();
  const [category, setCategory] = useState("all");

  const counts = useMemo(() => countLessonsByCategory(LESSONS), []);
  const filteredLessons = useMemo(
    () => filterLessonsByCategory(LESSONS, category),
    [category]
  );

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
  const nextRatio = next ? lessonProgressRatio(p, next) : 0;
  const nextPct = Math.round(nextRatio * 100);
  const doneCount = LESSONS.filter((l) => lessonDone(p, l.id)).length;

  return (
    <div className="space-y-6">
      {/* Header + Highlight Card song song trên desktop */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
        <header className="hero-in hero-in-1 flex flex-col justify-between rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] p-5 shadow-[var(--shadow-1)] sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-center gap-1.5 text-[var(--brand-deep)]">
              <Compass aria-hidden="true" className="h-4 w-4 shrink-0" />
              <p className="eyebrow">Lộ trình JLPT N5 · Bài bản từng bước</p>
            </div>
            <h1 className="font-display mt-2 text-[var(--fs-h1)] font-semibold tracking-tight text-[var(--text)]">
              Lộ trình học JLPT N5
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              Học theo thứ tự. Bài tiếp theo được gợi ý tối ưu khi bạn nắm ~40% bài trước — nhưng vẫn mở tự do nếu bạn muốn thử sức.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border)]/60">
            <ProgressBar
              value={doneCount}
              max={LESSONS.length}
              label="Tiến độ toàn lộ trình"
              color={doneCount === LESSONS.length ? "var(--success)" : "var(--brand)"}
            />
          </div>
        </header>

        {next && (
          <section className="hero-in hero-in-2 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--brand)]/15 bg-[var(--brand-soft)] p-5 shadow-[var(--shadow-1)] sm:p-6 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1 text-[11px] font-bold tracking-wide text-[var(--brand-deep)] shadow-[var(--shadow-1)]">
                  <Zap aria-hidden="true" className="h-3.5 w-3.5" />
                  Gợi ý học tiếp
                </span>
                <span className="tabular inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-muted)]">
                  <Clock aria-hidden="true" className="h-3.5 w-3.5 text-[var(--brand)]" />
                  {next.mins} phút
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold leading-snug text-[var(--text)] sm:text-xl">
                {next.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{next.summary}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--text-muted)]">Tiến độ bài học</span>
                  <span className="tabular font-bold text-[var(--brand-deep)]">
                    {nextPct > 0 ? `Đã học ~${nextPct}%` : "Chưa bắt đầu"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]/80">
                  <div
                    className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-500"
                    style={{ width: `${Math.max(nextPct, 4)}%` }}
                  />
                </div>
              </div>

              <Button onClick={() => go(`#/lesson/${next.id}`)} className="w-full sm:w-auto">
                <span>Học bài này ngay</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Bộ lọc phân loại */}
      <section aria-label="Lọc theo chủ đề" className="hero-in hero-in-3">
        <div
          role="tablist"
          aria-label="Lọc bài học theo chủ đề"
          className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1"
        >
          {ROADMAP_CATEGORIES.map((cat) => {
            const active = category === cat.id;
            const count = counts[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(cat.id)}
                className={cx(
                  "inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition-colors duration-150",
                  active
                    ? "bg-[var(--brand-deep)] font-semibold text-[var(--on-brand)] shadow-[var(--shadow-1)]"
                    : "bg-[var(--surface-2)] font-medium text-[var(--text-muted)] hover:bg-[var(--surface-high)] hover:text-[var(--text)]"
                )}
              >
                <span>{cat.label}</span>
                <span className="tabular text-xs opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Danh sách bài học — lưới 2 cột trên tablet/desktop */}
      <section aria-label="Danh sách bài N5">
        {filteredLessons.length === 0 ? (
          <EmptyState
            title="Không có bài trong nhóm này"
            hint="Chọn nhóm khác hoặc xem toàn bộ lộ trình."
            actionLabel="Xem tất cả"
            onAction={() => setCategory("all")}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredLessons.map((l, idx) => {
              const done = lessonDone(p, l.id);
              const locked = softLocked(p, l);
              const prev = locked ? lessonById(l.after) : null;
              const ratio = lessonProgressRatio(p, l);
              const pct = Math.round(ratio * 100);
              const globalNum = LESSONS.findIndex((x) => x.id === l.id) + 1;

              return (
                <li
                  key={l.id}
                  className="fade-up"
                  style={{ animationDelay: `${Math.min(idx, 9) * 0.04}s` }}
                >
                  <a
                    href={`#/lesson/${l.id}`}
                    className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[var(--shadow-2)] active:scale-[0.99]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <span
                        aria-label={done ? "Đã hoàn thành" : "Chưa hoàn thành"}
                        className={cx(
                          "font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl font-bold",
                          emblemStyle(l.kind, done)
                        )}
                      >
                        {done ? (
                          <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                        ) : (
                          KIND_ICON[l.kind] || "語"
                        )}
                      </span>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <LevelBadge level={l.level} />
                          <span className="tabular inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                            {l.mins} phút
                          </span>
                          <span className="text-xs text-[var(--text-faint)]">
                            · Bài {String(globalNum).padStart(2, "0")}
                          </span>
                        </div>

                        <h3 className="truncate text-[15px] font-semibold text-[var(--text)]">
                          {l.title}
                        </h3>
                        <p className="truncate text-xs text-[var(--text-muted)]">{l.summary}</p>

                        <div className="pt-0.5 text-xs">
                          {done ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--success)]">
                              <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Đã hoàn thành
                            </span>
                          ) : locked && prev ? (
                            <span className="inline-flex items-center gap-1 text-[var(--warning)]">
                              <Lock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">Nên học sau khi xong “{prev.title}”</span>
                            </span>
                          ) : pct > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--surface-2)]">
                                <div
                                  className="h-full rounded-full bg-[var(--success)]"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="tabular font-medium text-[var(--success)]">
                                Đã nắm ~{pct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--text-faint)]">Sẵn sàng học</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-[var(--text-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand)]"
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Lời nhắc Wabi-Sabi */}
      <footer className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-low)] p-5 text-center">
        <span lang="ja" className="font-display mb-1 text-lg font-semibold text-[var(--outline)] select-none">
          一歩一歩
        </span>
        <p className="max-w-lg text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
          “Ippo ippo” — Từng bước một. Giữ nhịp học 15 phút mỗi ngày để tạo phản xạ tự nhiên.
        </p>
      </footer>
    </div>
  );
}

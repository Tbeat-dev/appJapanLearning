import { useMemo } from "react";
import {
  Flame,
  Target,
  Layers,
  Play,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  ArrowRight,
  Quote,
  Sparkles,
  LockOpen,
} from "lucide-react";
import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import ListenButton from "../components/common/ListenButton.jsx";
import { LevelBadge } from "../components/common/Chip.jsx";
import { useProfile, calcStreak, todayStr } from "../lib/progress.js";
import { nextLesson, LESSONS, lessonDone, lessonProgressRatio } from "../lib/roadmap.js";
import { loadProfile } from "../components/ProfileSetup.jsx";
import { getDailyProverb, getGreeting } from "../lib/uiHelpers.js";

const cx = (...a) => a.filter(Boolean).join(" ");

const KIND_ICON = { kana: "あ", kanji: "漢", num: "数", vocab: "語", grammar: "文" };

function countWrong(wrong) {
  return Object.keys(wrong || {}).length;
}

function FujiBackdropArt() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-5 -right-3 h-40 w-40 select-none opacity-25 sm:h-48 sm:w-48"
    >
      <svg className="h-full w-full text-[var(--brand-deep)]" fill="none" viewBox="0 0 200 200">
        <circle cx="100" cy="85" fill="currentColor" fillOpacity="0.18" r="48" />
        <path
          d="M40 180L90 100C94 94 106 94 110 100L160 180H40Z"
          fill="currentColor"
          fillOpacity="0.32"
        />
        <path
          d="M85 108L90 100C94 94 106 94 110 100L115 108C110 114 108 110 100 115C92 110 90 114 85 108Z"
          fill="var(--surface)"
        />
        <path
          d="M20 160C50 156 80 164 120 160C150 157 175 162 190 160"
          stroke="currentColor"
          strokeLinecap="round"
          strokeOpacity="0.28"
          strokeWidth="2.5"
        />
        <path
          d="M35 174C65 170 95 176 135 172C160 169 175 173 185 172"
          stroke="currentColor"
          strokeLinecap="round"
          strokeOpacity="0.18"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

/**
 * Hôm nay — Trang chính responsive:
 * Mobile: dòng chảy thumb-friendly (Greeting → Việc nên làm ngay → Stats 3 thẻ → Lộ trình → Danh ngôn).
 * Desktop (≥1024px): lưới 12 cột thoáng rộng với Hero & Priority Action song song, Stats & Proverb cân đối, Lộ trình 3 cột.
 */
export default function Today({ go }) {
  const p = useProfile();
  const prof = loadProfile();

  const streak = calcStreak(p.days || {});
  const activeDays = Object.values(p.days || {}).filter((n) => n > 0).length;
  const todayCount = p.days?.[todayStr()] || 0;
  const goal = p.settings?.goal || 10;
  const goalPct = Math.min(100, Math.round((todayCount / Math.max(1, goal)) * 100));
  const wrongN = countWrong(p.wrong);
  const studied = activeDays > 0;
  const lesson = nextLesson(p);
  const isDoneLesson = !!(p.lessons?.[lesson.id]?.done);
  const proverb = useMemo(() => getDailyProverb(), []);
  const greeting = getGreeting();

  const primary = useMemo(() => {
    if (wrongN > 0) {
      return {
        tag: "Ưu tiên hôm nay",
        mins: Math.max(3, Math.min(15, Math.ceil(wrongN / 2))),
        title: `Ôn ${wrongN} thẻ đang yếu`,
        hint: "Ôn lại đúng thời điểm sắp quên để chuyển vào trí nhớ dài hạn.",
        cta: "Bắt đầu ôn tập",
        onClick: () => go("#/review"),
        secondaryLabel: isDoneLesson ? "Mở lộ trình N5" : lesson.title,
        secondaryHref: isDoneLesson ? "#/roadmap" : `#/lesson/${lesson.id}`,
      };
    }
    return {
      tag: "Ưu tiên hôm nay",
      mins: lesson.mins || 15,
      title: isDoneLesson ? "Ôn lại bài trên lộ trình" : `Tiếp tục: ${lesson.title}`,
      hint: lesson.summary,
      cta: isDoneLesson ? "Mở lộ trình" : "Bắt đầu bài học",
      onClick: () => go(isDoneLesson ? "#/roadmap" : `#/lesson/${lesson.id}`),
      secondaryLabel: "Luyện đề thử N5 (20 câu)",
      secondaryHref: "#/test",
    };
  }, [wrongN, lesson, isDoneLesson, go]);

  const previewLessons = useMemo(() => {
    const nextIdx = LESSONS.findIndex((l) => l.id === lesson.id);
    const start = Math.max(0, Math.min(nextIdx > 0 ? nextIdx - 1 : 0, LESSONS.length - 3));
    return LESSONS.slice(start, start + 3);
  }, [lesson.id]);

  return (
    <div className="space-y-6">
      {/* Hàng 1: Hero Greeting + Priority Action (12 cột trên desktop) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        <section className="hero-in hero-in-1 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)] p-5 shadow-[var(--shadow-1)] sm:p-6 lg:col-span-7">
          <FujiBackdropArt />

          <div className="relative z-10 space-y-2">
            <p className="eyebrow text-[var(--outline)]">
              {greeting} · Bản N5 miễn phí offline
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <h1 className="font-display text-[var(--fs-h1)] font-semibold tracking-tight text-[var(--text)]">
                {prof.name ? `Chào, ${prof.name}` : "Sẵn sàng học tiếng Nhật?"}
              </h1>
              <LevelBadge level="N5" />
            </div>
            <p className="max-w-md pt-1 text-sm leading-relaxed text-[var(--text-muted)]">
              Mỗi nét chữ là một bước chạm tới tiếng Nhật tự nhiên. Dành 15 phút tĩnh tâm cùng HirataLearn hôm nay.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex items-center gap-2.5 text-xs font-medium text-[var(--text-muted)]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span>
              {studied
                ? `Bạn đã duy trì học ${activeDays} ngày · ${todayCount}/${goal} lượt hôm nay`
                : "Không cần đăng nhập · Mọi tiến độ lưu an toàn trên máy bạn"}
            </span>
          </div>
        </section>

        {/* Hero Action Card: Việc nên làm ngay */}
        <section className="hero-in hero-in-2 flex flex-col justify-between rounded-2xl border border-[var(--brand)]/15 bg-[var(--brand-soft)] p-5 shadow-[var(--shadow-1)] sm:p-6 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="eyebrow rounded-md bg-[var(--brand)] px-2.5 py-1 text-[10px] text-[var(--on-brand)]">
                {primary.tag}
              </span>
              <span className="tabular inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-deep)]">
                <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                ~{primary.mins} phút
              </span>
            </div>

            <h2 className="mt-3 text-[var(--fs-h2)] font-bold leading-snug text-[var(--text)]">
              {primary.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{primary.hint}</p>
          </div>

          <div className="mt-5 space-y-2.5">
            <Button onClick={primary.onClick} className="w-full">
              <Play aria-hidden="true" className="h-4 w-4" />
              {primary.cta}
            </Button>
            <a
              href={primary.secondaryHref}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 py-1 text-center text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--brand)]"
            >
              <span>Hoặc chuyển đến:</span>
              <span className="truncate font-semibold text-[var(--text)] underline underline-offset-2">
                {primary.secondaryLabel}
              </span>
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        </section>
      </div>

      {/* Hàng 2: Thống kê 3 thẻ + Danh ngôn hôm nay */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch lg:gap-6">
        <div className="hero-in hero-in-3 flex flex-col justify-between gap-4 lg:col-span-7">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {/* Thẻ 1: Chuỗi */}
            <Card className="flex min-h-[108px] flex-col justify-between !p-3.5 sm:!p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">Chuỗi</span>
                <Flame aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--brand)]" />
              </div>
              <div className="mt-2">
                <p className="tabular text-xl font-bold leading-none text-[var(--brand-deep)] sm:text-2xl">
                  {streak} <span className="text-xs font-normal text-[var(--text-muted)]">ngày</span>
                </p>
                <p className="tabular mt-1.5 truncate text-[11px] text-[var(--text-faint)]">
                  Tổng: {activeDays} ngày
                </p>
              </div>
            </Card>

            {/* Thẻ 2: Mục tiêu */}
            <Card className="flex min-h-[108px] flex-col justify-between !p-3.5 sm:!p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">Mục tiêu</span>
                <Target aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--brand)]" />
              </div>
              <div className="mt-2">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="tabular text-xl font-bold leading-none text-[var(--text)] sm:text-2xl">
                    {todayCount}
                  </span>
                  <span className="tabular text-[11px] text-[var(--text-muted)]">/ {goal} lượt</span>
                </div>
                <ProgressBar
                  value={Math.min(todayCount, goal)}
                  max={goal}
                  color={todayCount >= goal ? "var(--success)" : "var(--brand)"}
                  className="mt-2 [&_div:first-child]:hidden"
                />
                <p className="tabular mt-1 text-right text-[11px] font-medium text-[var(--success)]">
                  {goalPct}%
                </p>
              </div>
            </Card>

            {/* Thẻ 3: Cần ôn */}
            <Card className="flex min-h-[108px] flex-col justify-between !p-3.5 sm:!p-4">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">Cần ôn</span>
                <Layers aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--warning)]" />
              </div>
              <div className="mt-2">
                <p className="tabular text-xl font-bold leading-none text-[var(--text)] sm:text-2xl">
                  {wrongN > 0 ? (
                    <>
                      {wrongN} <span className="text-xs font-normal text-[var(--text-muted)]">thẻ</span>
                    </>
                  ) : (
                    <span className="text-base font-semibold text-[var(--success)]">Ổn định</span>
                  )}
                </p>
                <a
                  href="#/review"
                  className="mt-1.5 inline-block truncate text-[11px] font-semibold text-[var(--brand)] hover:underline"
                >
                  {wrongN > 0 ? "Ôn ngay →" : "Mở thẻ ôn →"}
                </a>
              </div>
            </Card>
          </div>

          {!studied && (
            <Card className="flex flex-col justify-between gap-3 bg-[var(--surface-low)] sm:flex-row sm:items-center">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[var(--text)]">Lần đầu học tiếng Nhật?</h3>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  Bắt đầu từ bảng Hiragana cơ bản — học phát âm, viết nét và trắc nghiệm ngay.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => go("#/lesson/hira")}
              >
                <BookOpen aria-hidden="true" className="h-4 w-4" />
                Bài đầu tiên
              </Button>
            </Card>
          )}
        </div>

        {/* Danh ngôn hôm nay · Kotowaza */}
        <section className="hero-in hero-in-3 flex items-start gap-3.5 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-low)] p-5 lg:col-span-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-high)] text-[var(--text-muted)]">
            <Quote aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow text-[var(--outline)]">Danh ngôn hôm nay · ことわざ</p>
              <ListenButton text={proverb.jp} size="sm" label={`Nghe danh ngôn ${proverb.jp}`} />
            </div>
            <p lang="ja" className="font-display text-lg font-semibold leading-snug text-[var(--text)]">
              {proverb.jp}
              <span className="ml-2 font-sans text-xs font-normal text-[var(--text-muted)]">
                ({proverb.romaji})
              </span>
            </p>
            <p className="text-sm italic leading-relaxed text-[var(--text-muted)]">“{proverb.vi}”</p>
          </div>
        </section>
      </div>

      {/* Hàng 3: Lộ trình tiếp theo (3 cột trên desktop, danh sách trên mobile) */}
      <section aria-labelledby="path-preview" className="hero-in hero-in-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 id="path-preview" className="text-[var(--fs-h3)] font-bold text-[var(--text)]">
              Lộ trình tiếp theo
            </h2>
            <LevelBadge level="N5" />
          </div>
          <a
            href="#/roadmap"
            className="inline-flex min-h-10 items-center gap-0.5 text-sm font-semibold text-[var(--brand)] hover:underline"
          >
            <span>Xem tất cả</span>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>

        <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {previewLessons.map((l) => {
            const done = lessonDone(p, l.id);
            const ratio = lessonProgressRatio(p, l);
            const pct = Math.round(ratio * 100);
            const isCurrent = l.id === lesson.id && !done;
            const idxNum = LESSONS.findIndex((x) => x.id === l.id) + 1;

            return (
              <li key={l.id}>
                <a
                  href={`#/lesson/${l.id}`}
                  className={cx(
                    "group flex h-full items-center justify-between gap-3 rounded-2xl border p-4 shadow-[var(--shadow-1)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[var(--shadow-2)] active:scale-[0.99]",
                    isCurrent
                      ? "border-[var(--brand)]/40 bg-[var(--surface)] ring-1 ring-[var(--brand)]/15"
                      : "border-[var(--border)]/80 bg-[var(--surface)]"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className={cx(
                        "font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold",
                        done
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : isCurrent
                            ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                            : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                      )}
                    >
                      {done ? <Check aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} /> : KIND_ICON[l.kind] || "あ"}
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                        <span className={isCurrent ? "text-[var(--brand)]" : done ? "text-[var(--success)]" : "text-[var(--outline)]"}>
                          Bài {String(idxNum).padStart(2, "0")}
                          {isCurrent ? " · Đang học" : ""}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular">{l.mins} phút</span>
                      </div>

                      <h3 className="truncate text-[15px] font-semibold text-[var(--text)]">{l.title}</h3>

                      {done ? (
                        <p className="flex items-center gap-1 text-xs font-medium text-[var(--success)]">
                          <Check aria-hidden="true" className="h-3.5 w-3.5" />
                          <span>Đã hoàn thành</span>
                        </p>
                      ) : pct > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--surface-2)]">
                            <div
                              className="h-full rounded-full bg-[var(--brand)]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="tabular text-xs text-[var(--text-muted)]">Đã nắm ~{pct}%</span>
                        </div>
                      ) : (
                        <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <LockOpen aria-hidden="true" className="h-3.5 w-3.5" />
                          <span>Sẵn sàng học</span>
                        </p>
                      )}
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
      </section>
    </div>
  );
}

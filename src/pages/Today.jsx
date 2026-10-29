import { useMemo } from "react";
import { Flame, Target, Layers, Play, BookOpen } from "lucide-react";
import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import { LevelBadge } from "../components/common/Chip.jsx";
import { useProfile, calcStreak, todayStr } from "../lib/progress.js";
import { nextLesson, lessonById, LESSONS } from "../lib/roadmap.js";
import { loadProfile } from "../components/ProfileSetup.jsx";
import bgFuji from "../images/background.png";

function countWrong(wrong) {
  return Object.keys(wrong || {}).length;
}

/**
 * Hôm nay — việc nên làm ngay, một nút chính.
 * Người mới: lời mời bắt đầu, không hiển thị số 0 giả.
 */
export default function Today({ go }) {
  const p = useProfile();
  const prof = loadProfile();

  const streak = calcStreak(p.days || {});
  const todayCount = p.days?.[todayStr()] || 0;
  const goal = p.settings?.goal || 10;
  const wrongN = countWrong(p.wrong);
  const studied = Object.values(p.days || {}).some((n) => n > 0);
  const lesson = nextLesson(p);
  const isDoneLesson = !!(p.lessons?.[lesson.id]?.done);

  const primary = useMemo(() => {
    if (wrongN > 0) {
      return {
        title: `Ôn ${wrongN} thẻ đang yếu`,
        hint: "Ôn lại đúng lúc sắp quên để nhớ lâu hơn.",
        cta: "Bắt đầu ôn tập",
        onClick: () => go("#/review"),
      };
    }
    return {
      title: isDoneLesson ? "Ôn lại bài trên lộ trình" : `Tiếp tục: ${lesson.title}`,
      hint: lesson.summary,
      cta: isDoneLesson ? "Mở lộ trình" : "Bắt đầu bài học",
      onClick: () => go(isDoneLesson ? "#/roadmap" : `#/lesson/${lesson.id}`),
    };
  }, [wrongN, lesson, isDoneLesson, go]);

  return (
    <div className="relative space-y-6">
      {/* Ảnh nền trang chủ — chỉ ở Hôm nay (mục 5.3). Chữ nằm trên thẻ/surface, không đặt trực tiếp lên ảnh. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-dvh select-none overflow-hidden lg:left-60">
        <img
          src={bgFuji}
          alt=""
          draggable={false}
          loading="eager"
          className="kb-1 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/55 via-[var(--bg)]/70 to-[var(--bg)]/92" />
      </div>

      <div className="relative z-10 space-y-6">
      <header className="hero-in hero-in-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Hôm nay
          </p>
          <h1 className="mt-1 text-[var(--fs-h1)] font-bold leading-tight">
            {prof.name ? `Chào, ${prof.name}` : "Sẵn sàng học?"}
          </h1>
        </div>
        <LevelBadge level="N5" />
      </header>

      {/* Việc nên làm ngay — một nút chính */}
      <Card className="hero-in hero-in-2 !p-5">
        <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Việc nên làm ngay
        </p>
        <h2 className="mt-2 text-[var(--fs-h2)] font-bold leading-snug">{primary.title}</h2>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">{primary.hint}</p>
        <Button onClick={primary.onClick} className="mt-4 w-full sm:w-auto">
          <Play aria-hidden="true" className="h-4 w-4" />
          {primary.cta}
        </Button>
      </Card>

      {!studied ? (
        <Card className="hero-in hero-in-3">
          <h3 className="text-[var(--fs-h3)] font-semibold">Lần đầu tiên?</h3>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Bắt đầu bằng Hiragana — nền tảng của mọi từ tiếng Nhật. Miễn phí, không cần đăng nhập, chạy offline.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => go("#/lesson/hira")}
          >
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            Bắt đầu bài đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="hero-in hero-in-3 grid gap-3 sm:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Flame aria-hidden="true" className="h-4 w-4" />
              <span className="text-sm">Chuỗi ngày học</span>
            </div>
            <p className="mt-2 text-[var(--fs-h1)] font-bold">{streak} ngày</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Target aria-hidden="true" className="h-4 w-4" />
              <span className="text-sm">Mục tiêu hôm nay</span>
            </div>
            <ProgressBar
              value={Math.min(todayCount, goal)}
              max={goal}
              label={todayCount >= goal ? "Đã đạt mục tiêu" : "Số lượt học"}
              className="mt-3"
              color={todayCount >= goal ? "var(--success)" : "var(--brand)"}
            />
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Layers aria-hidden="true" className="h-4 w-4" />
              <span className="text-sm">Thẻ cần ôn</span>
            </div>
            <p className="mt-2 text-[var(--fs-h1)] font-bold">
              {wrongN > 0 ? `${wrongN} thẻ` : "Không có"}
            </p>
            {wrongN === 0 && (
              <button
                type="button"
                onClick={() => go("#/review")}
                className="mt-1 text-sm font-semibold text-[var(--brand)] hover:underline"
              >
                Vẫn có thể ôn lại lộ trình
              </button>
            )}
          </Card>
        </div>
      )}

      <section aria-labelledby="path-preview" className="hero-in hero-in-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="path-preview" className="text-[var(--fs-h3)] font-semibold">
            Lộ trình N5
          </h2>
          <a href="#/roadmap" className="text-sm font-semibold text-[var(--brand)] hover:underline">
            Xem tất cả
          </a>
        </div>
        <ul className="space-y-2">
          {LESSONS.slice(0, 3).map((l) => {
            const done = !!p.lessons?.[l.id]?.done;
            return (
              <li key={l.id}>
                <a
                  href={`#/lesson/${l.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-[var(--shadow-2)] active:scale-[0.995]"
                >
                  <span
                    aria-hidden="true"
                    className={
                      done
                        ? "flex h-8 w-8 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]"
                        : "flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--text-muted)]"
                    }
                  >
                    {done ? "✓" : "あ"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.title}</span>
                    <span className="block text-xs text-[var(--text-muted)]">{l.mins} phút</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
      </div>
    </div>
  );
}

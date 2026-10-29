import { Check } from "lucide-react";
import Button from "./common/Button.jsx";

const cx = (...a) => a.filter(Boolean).join(" ");

export const PROFILE_KEY = "kanalearn.profile";

export const AVATARS = ["🇯🇵", "⛩️", "🌸", "🦊", "🐱", "🗡️", "🎯", "📚", "🍜", "🚀", "🎧", "✨"];

export const GOALS = [
  { id: "n5", label: "JLPT N5", desc: "Từ vựng & chữ cái cơ bản" },
  { id: "n4", label: "JLPT N4", desc: "Mở rộng từ vựng, grammar" },
  { id: "n3", label: "JLPT N3", desc: "Đọc hiểu trung cấp" },
  { id: "talk", label: "Giao tiếp", desc: "Nghe nói hằng ngày" },
];

export const LEVELS = [
  { id: "new", label: "Mới bắt đầu", desc: "Chưa biết gì" },
  { id: "basic", label: "Đã biết Kana", desc: "Hiragana/Katakana" },
  { id: "some", label: "Đã học vài tháng", desc: "Cơ bản sơ khai" },
];

export const DAY_GOALS = [10, 15, 20, 30];

export const goalLabel = (id) => GOALS.find((g) => g.id === id)?.label;
export const levelLabel = (id) => LEVELS.find((l) => l.id === id)?.label;

export const loadProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveProfile = (p) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("profile:updated"));
  } catch {
    /* ignore quota */
  }
};

export const profileDone = (p) => !!(p && p.name && p.avatar && p.goal && p.level && p.daily);

function Section({ step, title, children, className = "" }) {
  return (
    <section
      className={cx(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]",
        className
      )}
    >
      <h2 className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {step}
      </h2>
      <p className="mt-1 text-[var(--fs-h3)] font-bold text-[var(--text)]">{title}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * 4 trường hồ sơ — dùng cho trang Hồ sơ (chỉnh sửa).
 * Onboarding có wizard riêng; component này không hiển thị nút chính.
 */
export default function ProfileSetup({ p, set, done, saved, onView, onLearn, actions = true }) {
  return (
    <>
      <Section step="1 · Hình ảnh" title="Avatar & tên">
        <div role="radiogroup" aria-label="Chọn avatar" className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={p.avatar === a}
              aria-label={`Avatar ${a}`}
              onClick={() => set("avatar", a)}
              className={cx(
                "flex aspect-square items-center justify-center rounded-[var(--radius-md)] border-2 text-xl transition duration-150 active:scale-95",
                p.avatar === a
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/40"
              )}
            >
              {a}
            </button>
          ))}
        </div>
        <label htmlFor="pf-name" className="mt-4 block text-sm font-semibold text-[var(--text)]">
          Tên
        </label>
        <input
          id="pf-name"
          value={p.name || ""}
          onChange={(e) => set("name", e.target.value.slice(0, 30))}
          placeholder="Tên của bạn"
          maxLength={30}
          className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--fs-body)] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
        />
      </Section>

      <Section step="2 · Mục tiêu" title="Học theo hướng nào?" className="mt-3">
        <div role="radiogroup" aria-label="Mục tiêu học" className="grid gap-2 sm:grid-cols-2">
          {GOALS.map((g) => {
            const on = p.goal === g.id;
            return (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("goal", g.id)}
                className={cx(
                  "rounded-[var(--radius-md)] border-2 p-3.5 text-left transition duration-150 active:scale-[0.98]",
                  on
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/35"
                )}
              >
                <div className="text-sm font-bold text-[var(--text)]">{g.label}</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">{g.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section step="3 · Trình độ" title="Bạn đã biết gì?" className="mt-3">
        <div role="radiogroup" aria-label="Trình độ hiện tại" className="flex flex-col gap-2">
          {LEVELS.map((l) => {
            const on = p.level === l.id;
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("level", l.id)}
                className={cx(
                  "flex items-center justify-between gap-3 rounded-[var(--radius-md)] border-2 px-4 py-3 text-left transition duration-150 active:scale-[0.98]",
                  on
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/35"
                )}
              >
                <span>
                  <span className="block text-sm font-bold text-[var(--text)]">{l.label}</span>
                  <span className="block text-xs text-[var(--text-muted)]">{l.desc}</span>
                </span>
                {on && <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--brand)]" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section step="4 · Nhịp học" title="Mỗi ngày học bao lâu?" className="mt-3">
        <div role="radiogroup" aria-label="Thời gian học mỗi ngày" className="grid grid-cols-4 gap-2">
          {DAY_GOALS.map((m) => {
            const on = p.daily === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("daily", m)}
                className={cx(
                  "flex flex-col items-center rounded-[var(--radius-md)] border-2 py-3 transition duration-150 active:scale-95",
                  on
                    ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/35"
                )}
              >
                <span className={cx("text-lg font-bold", on ? "text-[var(--brand)]" : "text-[var(--text)]")}>{m}</span>
                <span className="text-[10px] text-[var(--text-muted)]">phút</span>
              </button>
            );
          })}
        </div>
      </Section>

      <section className="mt-4">
        {done ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--success-soft)] p-4 text-center">
            <p className="text-sm font-semibold text-[var(--success)]">✓ Hồ sơ đã hoàn tất</p>
            {actions && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => onView?.()} className="flex-1">
                  Xem hồ sơ &amp; tiến độ
                </Button>
                <Button onClick={() => onLearn?.()} className="flex-1">
                  Bắt đầu học
                </Button>
              </div>
            )}
            {saved && <p className="mt-2 text-[11px] text-[var(--success)]">✓ Tự lưu trên máy bạn</p>}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-center">
            <p className="text-sm text-[var(--text-muted)]">Hoàn thành 4 bước ở trên để lưu hồ sơ.</p>
          </div>
        )}
      </section>
    </>
  );
}

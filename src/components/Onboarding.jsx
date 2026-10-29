import { useEffect, useState } from "react";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import Button from "./common/Button.jsx";
import { loadProfile, profileDone, saveProfile, AVATARS, GOALS, LEVELS, DAY_GOALS } from "./ProfileSetup.jsx";

const cx = (...a) => a.filter(Boolean).join(" ");

const STEPS = [
  { key: "intro", title: "Chào bạn", sub: "HirataLearn giúp học tiếng Nhật N5 miễn phí, offline, không cần đăng nhập." },
  { key: "avatar", title: "Bạn là ai?", sub: "Chọn ảnh đại diện và đặt tên gọi thân mật." },
  { key: "goal", title: "Mục tiêu của bạn?", sub: "Chọn hướng học phù hợp — đổi sau được ở Cài đặt." },
  { key: "level", title: "Bạn đã biết gì?", sub: "Để gợi ý bài học bắt đầu cho đúng trình độ." },
  { key: "daily", title: "Học bao lâu mỗi ngày?", sub: "Chọn nhịp học vừa sức. Có thể đổi bất cứ lúc nào." },
];

/**
 * Onboarding bắt buộc: wizard 5 bước, mỗi bước một hành động chính.
 * Lưu ngay trên máy, không cần mạng.
 */
export default function Onboarding({ onDone }) {
  const [p, setP] = useState(loadProfile);
  const [step, setStep] = useState(() => {
    const s = loadProfile();
    if (profileDone(s)) return STEPS.length - 1;
    if (s.daily) return STEPS.length - 1;
    if (s.level) return STEPS.length - 2;
    if (s.goal) return STEPS.length - 3;
    if (s.name && s.avatar) return STEPS.length - 4;
    return 1;
  });

  useEffect(() => {
    saveProfile(p);
  }, [p]);

  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const done = profileDone(p);
  const cur = STEPS[step];
  const progress = ((step + (done && step === STEPS.length - 1 ? 1 : 0)) / STEPS.length) * 100;

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const canNext =
    (cur.key === "intro") ||
    (cur.key === "avatar" && p.avatar && p.name?.trim()) ||
    (cur.key === "goal" && p.goal) ||
    (cur.key === "level" && p.level) ||
    (cur.key === "daily" && p.daily);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Lập hồ sơ cơ bản"
      className="fixed inset-0 z-[90] overflow-y-auto bg-[var(--bg)]"
    >
      {/* Nền trang trí nhẹ */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="absolute -right-10 -top-10 select-none text-[180px] font-bold leading-none text-[var(--brand)] opacity-[0.04] ja-display">
          ひ
        </span>
        <span className="absolute -bottom-16 -left-8 select-none text-[140px] font-bold leading-none text-[var(--brand)] opacity-[0.04] ja-display">
          ら
        </span>
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-8 pt-6 sm:pt-10">
        {/* Header */}
        <header className="flex items-center gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              aria-label="Quay lại"
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--brand)]"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-lg font-bold text-[var(--on-brand)]"
            >
              ひ
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              HirataLearn
            </p>
            <p className="text-xs text-[var(--text-faint)]">
              Bước {step + 1}/{STEPS.length}
            </p>
          </div>
        </header>

        {/* Thanh tiến độ */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label="Tiến độ lập hồ sơ"
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
        >
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(8, progress || ((step + 1) / STEPS.length) * 100)}%` }}
          />
        </div>

        {/* Nội dung bước */}
        <main className="flex flex-1 flex-col justify-center py-8">
          <div key={cur.key} style={{ animation: "fade-up 0.25s ease-out both" }}>
            <h1 className="text-[var(--fs-h1)] font-bold leading-tight text-[var(--text)]">{cur.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{cur.sub}</p>

            {/* Intro */}
            {cur.key === "intro" && (
              <ul className="mt-8 space-y-3">
                {[
                  ["無料", "Miễn phí trọn đời"],
                  ["オフライン", "Chạy offline trên máy"],
                  ["登録不要", "Không cần đăng nhập"],
                ].map(([ja, vi]) => (
                  <li
                    key={vi}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5"
                  >
                    <span
                      lang="ja"
                      className="ja-display flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]"
                    >
                      {ja.slice(0, 2)}
                    </span>
                    <span className="text-[15px] font-semibold text-[var(--text)]">{vi}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Avatar + tên */}
            {cur.key === "avatar" && (
              <div className="mt-8 space-y-6">
                <div>
                  <p id="avatar-label" className="mb-3 text-sm font-semibold text-[var(--text)]">
                    Chọn avatar
                  </p>
                  <div role="radiogroup" aria-labelledby="avatar-label" className="grid grid-cols-6 gap-2">
                    {AVATARS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        role="radio"
                        aria-checked={p.avatar === a}
                        aria-label={`Avatar ${a}`}
                        onClick={() => set("avatar", a)}
                        className={cx(
                          "flex aspect-square items-center justify-center rounded-[var(--radius-md)] border-2 text-2xl transition duration-150 active:scale-95",
                          p.avatar === a
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-[var(--shadow-1)]"
                            : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/40"
                        )}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="ob-name" className="mb-2 block text-sm font-semibold text-[var(--text)]">
                    Tên của bạn
                  </label>
                  <input
                    id="ob-name"
                    value={p.name || ""}
                    onChange={(e) => set("name", e.target.value.slice(0, 30))}
                    placeholder="VD: Thịnh"
                    maxLength={30}
                    autoComplete="nickname"
                    className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--fs-body)] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                  />
                </div>
              </div>
            )}

            {/* Goal */}
            {cur.key === "goal" && (
              <div role="radiogroup" aria-label="Mục tiêu học" className="mt-8 grid gap-2.5">
                {GOALS.map((g, i) => {
                  const on = p.goal === g.id;
                  const icons = ["N5", "N4", "N3", "話"];
                  return (
                    <button
                      key={g.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => set("goal", g.id)}
                      className={cx(
                        "flex items-center gap-3.5 rounded-[var(--radius-lg)] border-2 p-4 text-left transition duration-150 active:scale-[0.98]",
                        on
                          ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/35"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold",
                          on ? "bg-[var(--brand)] text-[var(--on-brand)]" : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                        )}
                      >
                        {icons[i]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-[var(--text)]">{g.label}</span>
                        <span className="block text-xs text-[var(--text-muted)]">{g.desc}</span>
                      </span>
                      {on && (
                        <Check aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--brand)]" strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Level */}
            {cur.key === "level" && (
              <div role="radiogroup" aria-label="Trình độ hiện tại" className="mt-8 grid gap-2.5">
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
                        "flex items-center gap-3.5 rounded-[var(--radius-lg)] border-2 p-4 text-left transition duration-150 active:scale-[0.98]",
                        on
                          ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/35"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                          on ? "border-[var(--brand)] bg-[var(--brand)]" : "border-[var(--border)]"
                        )}
                      >
                        {on && <span className="h-2 w-2 rounded-full bg-[var(--on-brand)]" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-bold text-[var(--text)]">{l.label}</span>
                        <span className="block text-xs text-[var(--text-muted)]">{l.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Daily */}
            {cur.key === "daily" && (
              <div role="radiogroup" aria-label="Thời gian học mỗi ngày" className="mt-8 grid grid-cols-2 gap-2.5">
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
                        "flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-lg)] border-2 py-6 transition duration-150 active:scale-95",
                        on
                          ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)]/35"
                      )}
                    >
                      <span className={cx("text-[28px] font-bold leading-none", on ? "text-[var(--brand)]" : "text-[var(--text)]")}>
                        {m}
                      </span>
                      <span className="text-xs font-medium text-[var(--text-muted)]">phút / ngày</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Done */}
            {cur.key === "daily" && done && (
              <p
                aria-live="polite"
                className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--success)]"
              >
                <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                Đã lưu trên máy — sẵn sàng học
              </p>
            )}
          </div>
        </main>

        {/* Nút chính cố định đáy */}
        <footer className="sticky bottom-0 -mx-5 bg-[var(--bg)]/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 backdrop-blur">
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canNext} className="w-full">
              Tiếp tục
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => onDone?.()} className="w-full">
              Bắt đầu học
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Button>
          )}
          {step > 0 && step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={next}
              className="mt-1 w-full min-h-11 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Bỏ qua
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

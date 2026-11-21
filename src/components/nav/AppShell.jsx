import { useEffect, useState } from "react";
import { Home, Map, RotateCcw, ClipboardCheck, BookOpen, Settings, User, Flame } from "lucide-react";
import { loadProfile } from "../ProfileSetup.jsx";
import { useProfile, calcStreak } from "../../lib/progress.js";

const cx = (...a) => a.filter(Boolean).join(" ");

export const NAV = [
  { id: "today", href: "#/", label: "Hôm nay", Icon: Home },
  { id: "roadmap", href: "#/roadmap", label: "Lộ trình", Icon: Map },
  { id: "review", href: "#/review", label: "Ôn tập", Icon: RotateCcw },
  { id: "test", href: "#/test", label: "Luyện đề", Icon: ClipboardCheck },
  { id: "library", href: "#/library", label: "Thư viện", Icon: BookOpen },
];

const PAGE_LABEL = {
  today: "Hôm nay",
  roadmap: "Lộ trình",
  review: "Ôn tập",
  test: "Luyện đề",
  library: "Thư viện",
  profile: "Hồ sơ",
  settings: "Cài đặt",
};

/**
 * Khung điều hướng responsive:
 * - Mobile / Tablet (<1024px): thanh trên gọn (56px) + thanh tab dưới (64px) ≤ 15% viewport.
 * - Desktop (≥1024px): thanh bên trái cố định (w-64) + vùng nội dung rộng đa cột.
 */
export default function AppShell({ page, children }) {
  const [prof, setProf] = useState(loadProfile);
  const progress = useProfile();
  const streak = calcStreak(progress.days || {});

  useEffect(() => {
    const onProfile = () => setProf(loadProfile());
    window.addEventListener("profile:updated", onProfile);
    return () => window.removeEventListener("profile:updated", onProfile);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-[var(--brand)] focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--on-brand)]"
      >
        Bỏ qua đến nội dung
      </a>

      {/* Sidebar máy tính (≥1024px) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <a
          href="#/"
          className="flex items-center gap-3 px-5 py-5 transition-opacity hover:opacity-90"
        >
          <span
            aria-hidden="true"
            className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-xl font-bold text-[var(--on-brand)] shadow-[var(--shadow-1)]"
          >
            ひ
          </span>
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-[19px] font-semibold tracking-tight text-[var(--brand)]">
              HirataLearn
            </span>
            <span className="block truncate text-[11px] font-medium text-[var(--text-muted)]">
              Tiếng Nhật N5 · Offline
            </span>
          </span>
        </a>

        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ id, href, label, Icon }) => {
            const on = page === id;
            return (
              <a
                key={id}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 text-sm transition-colors duration-150",
                  on
                    ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
                    : "font-medium text-[var(--text-muted)] hover:bg-[var(--surface-low)] hover:text-[var(--text)]"
                )}
              >
                <Icon aria-hidden="true" className="h-[19px] w-[19px] shrink-0" strokeWidth={on ? 2.2 : 1.75} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-[var(--border)] p-3">
          {streak > 0 && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-[var(--surface-low)] px-3.5 py-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-[var(--text-muted)]">
                <Flame aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />
                Chuỗi học tập
              </span>
              <span className="tabular font-bold text-[var(--brand)]">{streak} ngày</span>
            </div>
          )}
          <a
            href="#/profile"
            aria-current={page === "profile" ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 text-sm transition-colors duration-150",
              page === "profile"
                ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
                : "font-medium text-[var(--text-muted)] hover:bg-[var(--surface-low)] hover:text-[var(--text)]"
            )}
          >
            {prof.avatar ? (
              <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none">
                {prof.avatar}
              </span>
            ) : (
              <User aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            )}
            <span className="truncate">{prof.name ? prof.name : "Hồ sơ"}</span>
          </a>
          <a
            href="#/settings"
            aria-current={page === "settings" ? "page" : undefined}
            className={cx(
              "flex min-h-11 items-center gap-3 whitespace-nowrap rounded-xl px-3.5 text-sm transition-colors duration-150",
              page === "settings"
                ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
                : "font-medium text-[var(--text-muted)] hover:bg-[var(--surface-low)] hover:text-[var(--text)]"
            )}
          >
            <Settings aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span>Cài đặt</span>
          </a>
        </div>
      </aside>

      {/* Thanh trên cùng (điện thoại & máy tính bảng <1024px) — cao 56px */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)]/70 bg-[var(--bg)]/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-3 px-4">
          <a
            href="#/"
            className="flex min-w-0 items-center gap-2.5 rounded-xl py-1 pr-1 transition active:scale-[0.98]"
            aria-label="HirataLearn — về trang chủ"
          >
            <span
              aria-hidden="true"
              className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-[var(--on-brand)] shadow-[var(--shadow-1)]"
            >
              ひ
            </span>
            <span className="min-w-0 leading-tight">
              <span className="font-display block truncate text-[17px] font-semibold tracking-tight text-[var(--brand)]">
                HirataLearn
              </span>
              <span className="block truncate text-[11px] font-medium text-[var(--text-muted)]">
                Tiếng Nhật N5 · {PAGE_LABEL[page] || "Hôm nay"}
              </span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href="#/profile"
              aria-label={prof.name ? `Hồ sơ ${prof.name}` : "Hồ sơ học tập"}
              aria-current={page === "profile" ? "page" : undefined}
              className={cx(
                "relative flex h-11 w-11 items-center justify-center rounded-full border transition duration-150 active:scale-95",
                page === "profile"
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)]/50"
              )}
            >
              {prof.avatar ? (
                <span aria-hidden="true" className="text-lg leading-none">
                  {prof.avatar}
                </span>
              ) : (
                <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              )}
              {streak > 0 && (
                <span
                  aria-label={`Chuỗi ${streak} ngày`}
                  className="tabular absolute -bottom-1 -left-1.5 flex items-center gap-0.5 rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--brand)] shadow-[var(--shadow-1)] ring-1 ring-[var(--border)]"
                >
                  <span aria-hidden="true">🔥</span>
                  {streak}
                </span>
              )}
            </a>
            <a
              href="#/settings"
              aria-label="Cài đặt"
              aria-current={page === "settings" ? "page" : undefined}
              className={cx(
                "flex h-11 w-11 items-center justify-center rounded-full border transition duration-150 active:scale-95",
                page === "settings"
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)]/50 hover:text-[var(--brand)]"
              )}
            >
              <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </header>

      {/* Vùng nội dung chính */}
      <div className="lg:pl-64">
        <main
          id="main"
          className="nav-pad-bottom mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-10 lg:py-8 lg:pb-12"
        >
          {children}
        </main>
      </div>

      {/* Thanh điều hướng dưới (<1024px) — cao 64px */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)]/70 bg-[var(--bg)]/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] lg:hidden"
      >
        <ul className="mx-auto flex h-16 max-w-3xl items-center justify-around gap-1 px-1.5">
          {NAV.map(({ id, href, label, Icon }) => {
            const on = page === id;
            return (
              <li key={id} className="min-w-0 flex-1">
                <a
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "flex h-12 min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] tracking-tight transition-colors duration-150",
                    on
                      ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
                      : "font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                  )}
                >
                  <Icon aria-hidden="true" className="h-[21px] w-[21px] shrink-0" strokeWidth={on ? 2.2 : 1.75} />
                  <span className="truncate whitespace-nowrap">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

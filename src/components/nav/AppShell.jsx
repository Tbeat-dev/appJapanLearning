import { useEffect, useState } from "react";
import { Home, Map, RotateCcw, ClipboardCheck, BookOpen, Settings, User } from "lucide-react";
import { loadProfile } from "../ProfileSetup.jsx";

const cx = (...a) => a.filter(Boolean).join(" ");

export const NAV = [
  { id: "today", href: "#/", label: "Hôm nay", Icon: Home },
  { id: "roadmap", href: "#/roadmap", label: "Lộ trình", Icon: Map },
  { id: "review", href: "#/review", label: "Ôn tập", Icon: RotateCcw },
  { id: "test", href: "#/test", label: "Luyện đề", Icon: ClipboardCheck },
  { id: "library", href: "#/library", label: "Thư viện", Icon: BookOpen },
];

/**
 * Khung điều hướng: thanh dưới <1024px, thanh bên trái ≥1024px.
 * Nội dung có padding-bottom bằng chiều cao thanh dưới (nav-pad-bottom).
 */
export default function AppShell({ page, children }) {
  const [prof, setProf] = useState(loadProfile);

  useEffect(() => {
    const onProfile = () => setProf(loadProfile());
    window.addEventListener("profile:updated", onProfile);
    return () => window.removeEventListener("profile:updated", onProfile);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-[var(--brand)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--on-brand)]"
      >
        Bỏ qua đến nội dung
      </a>

      {/* Sidebar máy tính */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-lg font-bold text-[var(--on-brand)]"
          >
            ひ
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-bold">HirataLearn</div>
            <div className="truncate text-xs text-[var(--text-muted)]">Học tiếng Nhật từng bước</div>
          </div>
        </div>
        <nav aria-label="Điều hướng chính" className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ id, href, label, Icon }) => {
            const on = page === id;
            return (
              <a
                key={id}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition duration-150",
                  on
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                )}
              >
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
                {label}
              </a>
            );
          })}
        </nav>
        <div className="mt-auto space-y-1 border-t border-[var(--border)] p-3">
          <a
            href="#/profile"
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition duration-150",
              page === "profile"
                ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            )}
          >
            <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            Hồ sơ
          </a>
          <a
            href="#/settings"
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-semibold transition duration-150",
              page === "settings"
                ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            )}
          >
            <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            Cài đặt
          </a>
        </div>
        <div className="px-5 pb-4 text-[var(--fs-tiny)] text-[var(--text-faint)]">
          N5 · Miễn phí · Offline
        </div>
      </aside>

      {/* Thanh trên cùng (điện thoại) */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
          <a
            href="#/"
            className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] py-1 pr-2 transition active:scale-[0.97]"
            aria-label="HirataLearn — về trang chủ"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand)] text-base font-bold text-[var(--on-brand)]"
            >
              ひ
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold text-[var(--text)]">HirataLearn</span>
              <span className="block truncate text-[11px] text-[var(--text-muted)]">Tiếng Nhật N5</span>
            </span>
          </a>

          <div className="ml-auto flex items-center gap-1">
            <a
              href="#/profile"
              aria-label={prof.name ? `Hồ sơ ${prof.name}` : "Hồ sơ"}
              aria-current={page === "profile" ? "page" : undefined}
              className={cx(
                "flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border transition duration-150 active:scale-95",
                page === "profile"
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
              )}
            >
              {prof.avatar ? (
                <span aria-hidden="true" className="text-lg leading-none">
                  {prof.avatar}
                </span>
              ) : (
                <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              )}
            </a>
            <a
              href="#/settings"
              aria-label="Cài đặt"
              aria-current={page === "settings" ? "page" : undefined}
              className={cx(
                "flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border transition duration-150 active:scale-95",
                page === "settings"
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
              )}
            >
              <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </header>

      <div className="lg:pl-60">
        <main id="main" className="nav-pad-bottom mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 lg:max-w-4xl lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* Thanh điều hướng dưới (điện thoại) */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        style={{ height: "var(--nav-h)" }}
      >
        <ul className="mx-auto flex h-16 max-w-3xl items-stretch">
          {NAV.map(({ id, href, label, Icon }) => {
            const on = page === id;
            return (
              <li key={id} className="min-w-0 flex-1">
                <a
                  href={href}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-semibold transition duration-150",
                    on ? "text-[var(--brand)]" : "text-[var(--text-muted)]"
                  )}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={on ? 2.25 : 1.75} />
                  <span className="truncate">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

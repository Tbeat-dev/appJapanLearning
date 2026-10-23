import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import News from "./pages/News.jsx";
import Profile from "./pages/Profile.jsx";
import LearnApp from "../KanaLearn.jsx";
import bgFuji from "./images/background.png";

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

const parseHash = () => {
  const h = window.location.hash.replace(/^#\/?/, "");
  if (h === "learn" || h.startsWith("learn/")) return { page: "learn", tab: h.split("/")[1] || null };
  if (h === "news") return { page: "news" };
  if (h === "profile") return { page: "profile" };
  return { page: "home" };
};

const toHash = (page, tab) => {
  if (page === "learn") return tab ? `#/learn/${tab}` : "#/learn";
  if (page === "news") return "#/news";
  if (page === "profile") return "#/profile";
  return "#/";
};

export default function App() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route.page]);

  const go = (page, tab) => {
    window.location.hash = toHash(page, tab);
  };

  if (route.page === "learn") {
    return <LearnApp initialTab={route.tab} onHome={() => go("home")} />;
  }

  const isHome = route.page === "home";
  const navItems = [
    { key: "home", label: "Trang chủ" },
    { key: "news", label: "Tin tức" },
    { key: "profile", label: "Hồ sơ" },
  ];

  return (
    <div className="relative min-h-screen text-stone-900" style={JP}>
      {isHome && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden">
          <img src={bgFuji} alt="" draggable={false} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-50/50 via-stone-50/40 to-stone-50/80" />
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:max-w-4xl">
          <button
            type="button"
            onClick={() => go("home")}
            className="flex min-w-0 items-center gap-2.5 transition active:scale-[0.97]"
            aria-label="Về trang chủ"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-700 text-lg font-bold text-white shadow-sm transition duration-200 hover:rotate-6"
            >
              あ
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[15px] font-bold tracking-tight text-stone-900">KanaLearn</span>
              <span className="block truncate text-xs text-stone-500">Học tiếng Nhật từng bước</span>
            </span>
          </button>
          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Điều hướng">
            {navItems.map((n) => {
              const on = route.page === n.key;
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => go(n.key)}
                  aria-current={on ? "page" : undefined}
                  className={cx(
                    "relative rounded-xl px-2.5 py-2 text-[13px] font-medium transition duration-150 sm:px-3 sm:text-sm",
                    on ? "text-red-700" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  )}
                >
                  {on && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-red-700 animate-grow-x"
                    />
                  )}
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl pb-16 lg:max-w-4xl" key={route.page}>
        <div className="page-enter">
          {route.page === "home" && <Home onLearn={(tab) => go("learn", tab)} onNews={() => go("news")} />}
          {route.page === "news" && <News />}
          {route.page === "profile" && <Profile onLearn={() => go("learn")} />}
        </div>
      </main>

      <footer className="relative z-10 border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs leading-relaxed text-stone-500 sm:px-6 lg:max-w-4xl">
          <p className="font-semibold text-stone-700">Thái Quốc Thịnh</p>
          <p>Sinh viên năm 4 · Đại Học Khoa học Huế</p>
          <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a href="tel:0325745632" className="transition duration-150 hover:text-red-700">
              📞 0325745632
            </a>
            <a href="mailto:quocthinh120805@gmail.com" className="transition duration-150 hover:text-red-700">
              ✉️ quocthinh120805@gmail.com
            </a>
          </p>
          <p className="mt-2 text-stone-400">KanaLearn · Học tiếng Nhật N5 · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

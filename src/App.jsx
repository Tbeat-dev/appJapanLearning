import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import News from "./pages/News.jsx";
import Profile from "./pages/Profile.jsx";
import LearnApp from "../KanaLearn.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { goalLabel, loadProfile, profileDone } from "./components/ProfileSetup.jsx";
import bgFuji from "./images/background.png";

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const qi = raw.indexOf("?");
  const path = (qi >= 0 ? raw.slice(0, qi) : raw).replace(/\/+$/, "");
  const params = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : "");
  const sync = params.get("sync");
  const base = { sync: sync || null };
  if (path === "learn" || path.startsWith("learn/")) {
    return { ...base, page: "learn", tab: path.split("/")[1] || null };
  }
  if (path === "news") return { ...base, page: "news" };
  if (path === "profile") return { ...base, page: "profile" };
  return { ...base, page: "home" };
};

const toHash = (page, tab) => {
  if (page === "learn") return tab ? `#/learn/${tab}` : "#/learn";
  if (page === "news") return "#/news";
  if (page === "profile") return "#/profile";
  return "#/";
};

export default function App() {
  const [route, setRoute] = useState(parseHash);
  // Thiết bị chưa có hồ sơ → buộc lập hồ sơ cơ bản trước khi vào app
  const [needProfile, setNeedProfile] = useState(() => !profileDone(loadProfile()));
  // Hồ sơ hiển thị ở thanh trên cùng
  const [prof, setProf] = useState(loadProfile);

  useEffect(() => {
    const onProfile = () => setProf(loadProfile());
    window.addEventListener("profile:updated", onProfile);
    return () => window.removeEventListener("profile:updated", onProfile);
  }, []);

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

  const finishOnboarding = () => {
    setNeedProfile(false);
    // Giữ nguyên link đồng bộ (nếu có) để người dùng không mất mã nhập
    if (!route.sync) go("home");
  };

  const overlay = needProfile ? <Onboarding onDone={finishOnboarding} /> : null;

  if (route.page === "learn") {
    return (
      <>
        {overlay}
        <LearnApp initialTab={route.tab} onHome={() => go("home")} />
      </>
    );
  }

  const isHome = route.page === "home";

  return (
    <>
      {overlay}
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
            <button
              type="button"
              onClick={() => go("profile")}
              className="flex min-w-0 max-w-[55%] shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-2 py-1.5 text-left transition duration-150 hover:border-red-200 hover:bg-red-50/60 active:scale-[0.98]"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-700 text-base text-white shadow-sm"
              >
                {prof.avatar || "🇯🇵"}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-bold text-stone-900">
                  {prof.name ? `Chào, ${prof.name}!` : "Hồ sơ"}
                </span>
                <span className="block truncate text-[11px] text-stone-500">
                  {[goalLabel(prof.goal), prof.daily ? `${prof.daily} phút/ngày` : null].filter(Boolean).join(" · ") ||
                    "Chưa có hồ sơ"}
                </span>
              </span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl pb-16 lg:max-w-4xl" key={route.page}>
          <div className="page-enter">
            {route.page === "home" && <Home onLearn={(tab) => go("learn", tab)} onNews={() => go("news")} />}
            {route.page === "news" && <News />}
            {route.page === "profile" && (
              <Profile onLearn={() => go("learn")} syncCode={route.sync} onSyncConsumed={() => go("profile")} />
            )}
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
    </>
  );
}

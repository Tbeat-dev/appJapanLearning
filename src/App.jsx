import { useEffect, useState } from "react";
import AppShell from "./components/nav/AppShell.jsx";
import Footer from "./components/nav/Footer.jsx";
import Today from "./pages/Today.jsx";
import Roadmap from "./pages/Roadmap.jsx";
import Review from "./pages/Review.jsx";
import Test from "./pages/Test.jsx";
import Lesson from "./pages/Lesson.jsx";
import Library, { LibraryIndex } from "./pages/Library.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { ToastProvider } from "./components/common/Toast.jsx";
import { AchievementToast } from "./components/Achievements.jsx";
import { loadProfile, profileDone } from "./components/ProfileSetup.jsx";
import { useProfile } from "./lib/progress.js";
import { applyTheme } from "./lib/theme.js";
import { markTtsUnavailableClass } from "./lib/tts.js";

const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const qi = raw.indexOf("?");
  const path = (qi >= 0 ? raw.slice(0, qi) : raw).replace(/\/+$/, "");
  const params = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : "");
  const sync = params.get("sync") || null;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "lesson" && parts[1]) return { page: "lesson", lessonId: parts[1], sync };
  if (parts[0] === "roadmap") return { page: "roadmap", sync };
  if (parts[0] === "review") return { page: "review", sync };
  if (parts[0] === "test") return { page: "test", sync };
  if (parts[0] === "library") return { page: "library", sub: parts[1] || null, sync };
  if (parts[0] === "settings") return { page: "settings", sync };
  if (parts[0] === "profile") return { page: "profile", sync };
  return { page: "today", sync };
};

const navPage = (page) => {
  if (page === "lesson") return "roadmap";
  if (page === "library") return "library";
  if (page === "today") return "today";
  return page;
};

function hasAutostartFlag() {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  return q.get("autostart") === "1" || window.location.hash.includes("autostart=1");
}

function Screens({ route, go }) {
  switch (route.page) {
    case "roadmap":
      return <Roadmap go={go} />;
    case "lesson":
      return <Lesson lessonId={route.lessonId} go={go} />;
    case "review":
      return <Review go={go} />;
    case "test":
      return <Test />;
    case "library":
      return route.sub ? <Library sub={route.sub} go={go} /> : <LibraryIndex go={go} />;
    case "settings":
      return <Settings go={go} />;
    case "profile":
      return <Profile onLearn={() => go("#/roadmap")} syncCode={route.sync} onSyncConsumed={() => go("#/profile")} />;
    default:
      return <Today go={go} />;
  }
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [needProfile, setNeedProfile] = useState(
    () => !hasAutostartFlag() && !profileDone(loadProfile())
  );
  const p = useProfile();

  useEffect(() => {
    applyTheme(p.settings?.theme || "system");
    markTtsUnavailableClass();
  }, [p.settings?.theme]);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route.page, route.lessonId, route.sub]);

  useEffect(() => {
    if (!p.settings?.sound && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [p.settings?.sound]);

  const go = (hash) => {
    if (window.location.hash === hash) setRoute(parseHash());
    else window.location.hash = hash;
  };

  const finishOnboarding = () => {
    setNeedProfile(false);
    if (!route.sync) go("#/");
  };

  return (
    <ToastProvider>
      <AchievementToast />
      {needProfile && <Onboarding onDone={finishOnboarding} />}
      <AppShell page={navPage(route.page)}>
        <div key={`${route.page}:${route.lessonId || ""}:${route.sub || ""}`} className="page-enter">
          <Screens route={route} go={go} />
          {route.page === "today" && <Footer />}
        </div>
      </AppShell>
    </ToastProvider>
  );
}

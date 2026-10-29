import { useSyncExternalStore } from "react";
import { newlyUnlocked } from "./achievementData.js";

const LS_KEY = "kanalearn.progress.v1";
const DEFAULT_P = {
  known: { kanji: {}, vocab: {} },
  wrong: {},
  days: {},
  stats: {},
  timeSec: {},
  ach: {},
  flags: {},
  lessons: {},
  write: {},
  combo: 0,
  bestCombo: 0,
  cleared: 0,
  goalDays: 0,
  settings: { goal: 10, achFx: true, achSfx: false, theme: "system", furigana: true, sound: true },
};

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => fmtDate(new Date());

const mergeP = (p) => ({
  ...DEFAULT_P,
  ...p,
  known: { ...DEFAULT_P.known, ...(p.known || {}) },
  timeSec: { ...DEFAULT_P.timeSec, ...(p.timeSec || {}) },
  ach: { ...(p.ach || {}) },
  flags: { ...(p.flags || {}) },
  lessons: { ...(p.lessons || {}) },
  write: { ...(p.write || {}) },
  settings: { ...DEFAULT_P.settings, ...(p.settings || {}) },
});

function loadP() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const p = mergeP(parsed);
      // Hồ sơ cũ chưa có trường ach: mở thành tựu im lặng, không hiện toast dồn một lần
      if (!parsed.ach) {
        const ids = newlyUnlocked(p);
        if (ids.length) ids.forEach((id) => (p.ach[id] = Date.now()));
      }
      return p;
    }
  } catch (e) {
    /* corrupted */
  }
  return DEFAULT_P;
}

let P = typeof window !== "undefined" ? loadP() : DEFAULT_P;
const subs = new Set();

// opts.silent: vẫn mở khóa thành tựu nhưng không đưa vào toast (nhập/khôi phục tiến trình)
function setP(fn, opts = {}) {
  const { fresh: prevFresh = [], pending: prevPending = [], ...rest } = fn(P);
  const next = { ...rest, updatedAt: Date.now() };
  const ids = newlyUnlocked(next);
  if (ids.length) {
    next.ach = { ...next.ach };
    ids.forEach((id) => (next.ach[id] = Date.now()));
  }
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch (e) {
    /* quota */
  }
  // Thành tựu mới chưa hiện ngay: xếp hàng chờ, tới flushPending()
  // (người học bấm sang câu/cụm tiếp theo) mới đưa vào fresh và bật toast
  const opened = ids.length && !opts.silent ? ids : [];
  P = {
    ...next,
    fresh: prevFresh,
    pending: opened.length ? [...prevPending, ...opened] : prevPending,
  };
  if (opened.length) scheduleFlush();
  subs.forEach((f) => f());
}

// Chờ quá lâu mà không có thao tác nào (ở màn danh sách/flashcard) thì vẫn hiện
let flushTimer = 0;
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = 0;
    flushPending();
  }, 6000);
}
function flushPending() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = 0;
  }
  if (!P.pending || !P.pending.length) return;
  P = { ...P, fresh: [...(P.fresh || []), ...P.pending], pending: [] };
  subs.forEach((f) => f());
}
function dismissFresh() {
  P = { ...P, fresh: [] };
  subs.forEach((f) => f());
}

const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};

const useProfile = () => useSyncExternalStore(subscribe, () => P, () => P);
const getP = () => P;

// Đếm một lượt học: ghi ngày, khung giờ và số lần đạt mục tiêu trong ngày
const bump = (p) => {
  const day = todayStr();
  const before = p.days[day] || 0;
  const h = new Date().getHours();
  const flags = { ...p.flags };
  if (h >= 4 && h < 7) flags.early = true;
  if (h >= 22 || h < 4) flags.late = true;
  const goal = p.settings.goal;
  return {
    ...p,
    flags,
    days: { ...p.days, [day]: before + 1 },
    goalDays: (p.goalDays || 0) + (before < goal && before + 1 >= goal ? 1 : 0),
  };
};

function toggleKnown(sec, id) {
  setP((p) => {
    const cur = { ...(p.known[sec] || {}) };
    const on = !cur[id];
    if (on) cur[id] = true;
    else delete cur[id];
    const q = { ...p, known: { ...p.known, [sec]: cur } };
    return on ? bump(q) : q;
  });
}

function record(sec, key, ok) {
  setP((p) => {
    const st = p.stats[sec] || { ok: 0, total: 0 };
    const wk = sec + ":" + key;
    const w = { ...p.wrong };
    if (ok) {
      if (w[wk] > 1) w[wk]--;
      else delete w[wk];
    } else {
      w[wk] = (w[wk] || 0) + 1;
    }
    const combo = ok ? (p.combo || 0) + 1 : 0;
    return bump({
      ...p,
      wrong: w,
      combo,
      bestCombo: Math.max(p.bestCombo || 0, combo),
      stats: { ...p.stats, [sec]: { ok: st.ok + (ok ? 1 : 0), total: st.total + 1 } },
    });
  });
}

function markRemembered(wk) {
  setP((p) => {
    const w = { ...p.wrong };
    if (w[wk] > 1) w[wk]--;
    else delete w[wk];
    return { ...p, wrong: w };
  });
}

function setSetting(k, v) {
  setP((p) => ({ ...p, settings: { ...p.settings, [k]: v } }));
}

function setLesson(id, patch) {
  setP((p) => ({
    ...p,
    lessons: { ...p.lessons, [id]: { ...(p.lessons[id] || {}), ...patch } },
  }));
}

// Điểm viết (WritingPad) cao nhất theo từng chữ — chỉ giữ giá trị lớn hơn
function setWriteScore(ch, score) {
  if (!ch || !(score > 0)) return;
  if (((P.write || {})[ch] || 0) >= score) return;
  setP((p) => ({ ...p, write: { ...(p.write || {}), [ch]: score } }));
}

function importP(json) {
  setP(() => mergeP(json), { silent: true });
}

// Nhận tiến trình đã gộp từ thiết bị khác (mergeProgress trong sync.js)
function applyProgress(next) {
  setP(() => mergeP(next), { silent: true });
}

function resetP() {
  setP(() => ({
    ...DEFAULT_P,
    known: { kanji: {}, vocab: {} },
    wrong: {},
    days: {},
    stats: {},
    timeSec: {},
    lessons: {},
    write: {},
    settings: { ...DEFAULT_P.settings },
  }));
}

function calcStreak(days) {
  const d = new Date();
  if (!days[fmtDate(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[fmtDate(d)] > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export {
  fmtDate,
  todayStr,
  setP,
  getP,
  useProfile,
  toggleKnown,
  record,
  markRemembered,
  setSetting,
  setLesson,
  setWriteScore,
  importP,
  applyProgress,
  resetP,
  calcStreak,
  dismissFresh,
  flushPending,
};

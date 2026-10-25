import { useSyncExternalStore } from "react";

const LS_KEY = "kanalearn.progress.v1";
const DEFAULT_P = {
  known: { kanji: {}, vocab: {} },
  wrong: {},
  days: {},
  stats: {},
  timeSec: {},
  settings: { goal: 10 },
};

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => fmtDate(new Date());

const mergeP = (p) => ({
  ...DEFAULT_P,
  ...p,
  known: { ...DEFAULT_P.known, ...(p.known || {}) },
  timeSec: { ...DEFAULT_P.timeSec, ...(p.timeSec || {}) },
  settings: { ...DEFAULT_P.settings, ...(p.settings || {}) },
});

function loadP() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) return mergeP(JSON.parse(raw));
  } catch (e) {
    /* corrupted */
  }
  return DEFAULT_P;
}

let P = typeof window !== "undefined" ? loadP() : DEFAULT_P;
const subs = new Set();

function setP(fn) {
  P = { ...fn(P), updatedAt: Date.now() };
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(P));
  } catch (e) {
    /* quota */
  }
  subs.forEach((f) => f());
}

const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};

const useProfile = () => useSyncExternalStore(subscribe, () => P, () => P);
const getP = () => P;

const bump = (p) => ({
  ...p,
  days: { ...p.days, [todayStr()]: (p.days[todayStr()] || 0) + 1 },
});

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
    return bump({
      ...p,
      wrong: w,
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

function importP(json) {
  setP(() => mergeP(json));
}

// Nhận tiến trình đã gộp từ thiết bị khác (mergeProgress trong sync.js)
function applyProgress(next) {
  setP(() => mergeP(next));
}

function resetP() {
  setP(() => ({
    ...DEFAULT_P,
    known: { kanji: {}, vocab: {} },
    wrong: {},
    days: {},
    stats: {},
    timeSec: {},
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

function logStudy(seconds) {
  if (!seconds || seconds < 1) return;
  const s = Math.round(seconds);
  setP((p) => {
    const t = todayStr();
    return bump({
      ...p,
      timeSec: { ...p.timeSec, [t]: (p.timeSec[t] || 0) + s },
    });
  });
}

export {
  LS_KEY,
  DEFAULT_P,
  fmtDate,
  todayStr,
  mergeP,
  setP,
  getP,
  useProfile,
  toggleKnown,
  record,
  markRemembered,
  setSetting,
  importP,
  applyProgress,
  resetP,
  calcStreak,
  logStudy,
};

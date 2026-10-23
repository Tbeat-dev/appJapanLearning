import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { logStudy, todayStr } from "../lib/progress.js";

const cx = (...a) => a.filter(Boolean).join(" ");

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const LS = "kanalearn.focus";
const loadCfg = () => {
  try {
    const c = JSON.parse(localStorage.getItem(LS));
    if (c && (c.mode === "time" || c.mode === "count")) return c;
  } catch (e) {
    /* ignore */
  }
  return { mode: "time", minutes: 15, count: 20 };
};

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function useFocusSession({ secKey, kind, label }) {
  const [phase, setPhase] = useState("idle"); // idle | setup | active | summary
  const [cfg, setCfg] = useState(loadCfg);
  const [left, setLeft] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [startedAt, setStartedAt] = useState(0);
  const [returnNote, setReturnNote] = useState(false);
  const finishRef = useRef(() => {});
  const phaseRef = useRef(phase);
  const wrongKeys = useRef(new Set());
  phaseRef.current = phase;

  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(cfg));
    } catch (e) {
      /* ignore */
    }
  }, [cfg]);

  const finish = useCallback(() => {
    if (phaseRef.current !== "active") return;
    const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    if (seconds >= 10) logStudy(seconds);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setPhase("summary");
  }, [startedAt]);
  finishRef.current = finish;

  // đồng hồ đếm ngược — tự tạm dừng khi tab bị ẩn
  useEffect(() => {
    if (phase !== "active" || cfg.mode !== "time") return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setLeft((x) => {
        if (x <= 1) {
          finishRef.current();
          return 0;
        }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, cfg.mode]);

  // chế độ đếm số câu/thẻ
  useEffect(() => {
    if (phase !== "active" || cfg.mode !== "count") return;
    if (answered >= cfg.count) finishRef.current();
  }, [phase, cfg.mode, answered, cfg.count]);

  // quay lại tab → hiện thông báo tạm dừng
  useEffect(() => {
    if (phase !== "active") return;
    let t = 0;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        setReturnNote(true);
        clearTimeout(t);
        t = setTimeout(() => setReturnNote(false), 4000);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(t);
    };
  }, [phase]);

  // Esc kết thúc phiên (khi không ở fullscreen thì browser không chặn phím)
  useEffect(() => {
    if (phase !== "active") return;
    const onKey = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) finishRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // Wake Lock
  const lockRef = useRef(null);
  const acquireLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        lockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (e) {
      /* unsupported / denied */
    }
  }, []);
  const releaseLock = useCallback(() => {
    try {
      lockRef.current?.release();
    } catch (e) {
      /* ignore */
    }
    lockRef.current = null;
  }, []);
  useEffect(() => {
    if (phase !== "active") return;
    acquireLock();
    const onVis = () => {
      if (document.visibilityState === "visible") acquireLock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      releaseLock();
    };
  }, [phase, acquireLock, releaseLock]);

  const openSetup = () => setPhase("setup");
  const cancel = () => setPhase("idle");

  const start = async () => {
    setAnswered(0);
    setCorrect(0);
    setWrong([]);
    wrongKeys.current = new Set();
    setStartedAt(Date.now());
    setLeft(cfg.mode === "time" ? cfg.minutes * 60 : 0);
    setPhase("active");
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      /* fullscreen bị từ chối — vẫn chạy overlay */
    }
  };

  const answer = useCallback((ok, item) => {
    setAnswered((n) => n + 1);
    if (ok) setCorrect((n) => n + 1);
    else if (item) {
      const key = item.jp + "|" + (item.sub || "");
      if (!wrongKeys.current.has(key)) {
        wrongKeys.current.add(key);
        setWrong((w) => [...w, item]);
      }
    }
  }, []);

  const tick = useCallback(() => {
    setAnswered((n) => n + 1);
  }, []);

  return {
    phase,
    cfg,
    setCfg,
    left,
    answered,
    correct,
    wrong,
    returnNote,
    secKey,
    kind,
    label,
    active: phase === "active",
    openSetup,
    cancel,
    start,
    finish,
    answer,
    tick,
  };
}

function SetupModal({ fs }) {
  const { cfg, setCfg, start, cancel } = fs;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-stone-900/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="animate-pop w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl" style={JP}>
        <h3 className="text-base font-bold text-stone-900">🎯 Phiên tập trung</h3>
        <p className="mt-1 text-xs leading-snug text-stone-500">
          Chỉ còn bài học trên màn hình — không tab, không bộ lọc.
        </p>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Kiểu phiên</div>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {[
              ["time", "⏱ Đếm ngược"],
              ["count", "🔢 Số câu / thẻ"],
            ].map(([m, l]) => (
              <button
                key={m}
                type="button"
                onClick={() => setCfg({ ...cfg, mode: m })}
                className={cx(
                  "rounded-xl border py-2.5 text-sm font-semibold transition active:scale-95",
                  cfg.mode === m
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {cfg.mode === "time" ? (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">Thời lượng</div>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[10, 15, 25].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCfg({ ...cfg, minutes: m })}
                  className={cx(
                    "rounded-xl border py-2.5 text-sm font-semibold transition active:scale-95",
                    cfg.minutes === m
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  )}
                >
                  {m} phút
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Số {fs.kind === "card" ? "thẻ" : "câu"}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(fs.kind === "card" ? [10, 20, 30] : [10, 20, 40]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCfg({ ...cfg, count: c })}
                  className={cx(
                    "rounded-xl border py-2.5 text-sm font-semibold transition active:scale-95",
                    cfg.count === c
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  )}
                >
                  {c} {fs.kind === "card" ? "thẻ" : "câu"}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800">
          💡 Mẹo: bật “Không làm phiền” trên điện thoại / máy tính để không bị thông báo ngắt giữa phiên.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={cancel}
            className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 active:scale-[0.98]"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={start}
            className="rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 active:scale-[0.98]"
          >
            Bắt đầu →
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SummaryScreen({ fs }) {
  const total = fs.answered;
  const acc = total > 0 ? Math.round((fs.correct / total) * 100) : 0;
  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-stone-50" style={JP}>
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-8">
        <div className="animate-pop rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <div className="text-4xl">🎉</div>
            <h3 className="mt-2 text-xl font-bold text-stone-900">Phiên hoàn tất!</h3>
            <p className="mt-1 text-sm text-stone-500">{fs.label}</p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-stone-50 py-3">
              <div className="text-xl font-bold tabular-nums text-stone-900">{fs.correct}</div>
              <div className="text-[11px] text-stone-500">đúng</div>
            </div>
            <div className="rounded-xl bg-stone-50 py-3">
              <div className="text-xl font-bold tabular-nums text-stone-900">{total}</div>
              <div className="text-[11px] text-stone-500">{fs.kind === "card" ? "thẻ" : "câu"}</div>
            </div>
            <div className="rounded-xl bg-stone-50 py-3">
              <div className="text-xl font-bold tabular-nums text-emerald-600">{acc}%</div>
              <div className="text-[11px] text-stone-500">chính xác</div>
            </div>
          </div>

          {fs.wrong.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Từ cần ôn ({fs.wrong.length})
              </h4>
              <ul className="mt-2 space-y-1.5">
                {fs.wrong.slice(0, 8).map((w) => (
                  <li
                    key={w.jp + (w.sub || "")}
                    className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-stone-900" style={JP}>
                      {w.jp}
                    </span>
                    {w.sub && (
                      <span className="text-red-700" style={JP}>
                        {w.sub}
                      </span>
                    )}
                    {w.vi && <span className="truncate text-xs text-stone-500">— {w.vi}</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-stone-400">Đã lưu vào Hồ sơ · mục “Từ hay sai”.</p>
            </div>
          )}

          <button
            type="button"
            onClick={fs.cancel}
            className="mt-6 w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 active:scale-[0.98]"
          >
            Về bài học
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FocusHeader({ fs }) {
  const progress =
    fs.cfg.mode === "time"
      ? fs.cfg.minutes * 60 > 0
        ? ((fs.cfg.minutes * 60 - fs.left) / (fs.cfg.minutes * 60)) * 100
        : 0
      : fs.cfg.count > 0
        ? (fs.answered / fs.cfg.count) * 100
        : 0;

  return (
    <div className="border-b border-stone-200 bg-white/95 px-4 py-2.5 backdrop-blur" style={JP}>
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
          🎯 Tập trung
        </span>
        <div className="min-w-0 flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-red-600 transition-[width] duration-500"
              style={{ width: Math.min(100, Math.max(0, progress)) + "%" }}
            />
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums text-stone-900">
          {fs.cfg.mode === "time" ? fmtClock(fs.left) : `${fs.answered}/${fs.cfg.count}`}
        </span>
        <button
          type="button"
          onClick={fs.finish}
          className="shrink-0 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 active:scale-95"
        >
          Thoát
        </button>
      </div>
      {fs.returnNote && (
        <p className="mx-auto mt-1.5 max-w-xl rounded-lg bg-amber-50 px-3 py-1.5 text-center text-[11px] text-amber-800">
          Đã tạm dừng trong lúc bạn rời tab — tiếp tục nhé!
        </p>
      )}
    </div>
  );
}

export function FocusWrap({ fs, children }) {
  if (fs.phase === "summary") return <SummaryScreen fs={fs} />;

  if (fs.active) {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex flex-col bg-stone-50" style={JP}>
        <FocusHeader fs={fs} />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="mx-auto max-w-xl">{children}</div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={fs.openSetup}
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-700 active:scale-95"
        >
          🎯 Tập trung
        </button>
      </div>
      {children}
      {fs.phase === "setup" && <SetupModal fs={fs} />}
    </>
  );
}

export { useFocusSession };

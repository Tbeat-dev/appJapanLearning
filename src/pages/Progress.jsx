import { useMemo, useRef, useState } from "react";
import {
  useProfile,
  calcStreak,
  markRemembered,
  setSetting,
  importP,
  resetP,
  todayStr,
} from "../lib/progress.js";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import { AchievementsPanel } from "../components/Achievements.jsx";

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

// ---- tra cứu "từ hay sai" về nội dung hiển thị ----
const toKata = (s) =>
  [...s]
    .map((c) => {
      const n = c.charCodeAt(0);
      return n >= 0x3041 && n <= 0x3096 ? String.fromCharCode(n + 0x60) : c;
    })
    .join("");

const KANA_MAP = {};
kanaGroups.forEach((g) => {
  const ks = g.k.split(" ");
  const rs = g.r.split(" ");
  ks.forEach((c, i) => {
    if (c === "_") return;
    const r = rs[i];
    KANA_MAP[`hira-${g.id}-${i}`] = { jp: c, sub: r };
    KANA_MAP[`kata-${g.id}-${i}`] = { jp: toKata(c), sub: r };
  });
});
const KANJI_MAP = Object.fromEntries(kanjiList.map((w) => [String(w.id), w]));
const VOCAB_MAP = Object.fromEntries(vocabList.map((w) => [String(w.id), w]));

const vMain = (w) => w.kanji || w.kana.split(/\s*[\/,、]\s*/)[0].trim();

function describeWrong(wk) {
  const i = wk.indexOf(":");
  const sec = wk.slice(0, i);
  const id = wk.slice(i + 1);
  if (sec === "kana") {
    const c = KANA_MAP[id];
    return c ? { jp: c.jp, sub: c.sub, vi: "" } : { jp: id, sub: "", vi: "" };
  }
  if (sec === "kanji") {
    const w = KANJI_MAP[id];
    return w ? { jp: w.k, sub: w.h, vi: w.m } : { jp: id, sub: "", vi: "" };
  }
  if (sec === "vocab") {
    const w = VOCAB_MAP[id];
    return w ? { jp: vMain(w), sub: w.kanji ? w.kana : "", vi: w.vi } : { jp: id, sub: "", vi: "" };
  }
  if (sec === "num") return { jp: id, sub: "", vi: "Số đếm" };
  return { jp: id, sub: "", vi: "" };
}

const SEC_LABEL = { kana: "Chữ cái", kanji: "Hán tự", num: "Số đếm", vocab: "Từ vựng" };

// ---- heatmap 12 tuần ----
function heatColor(n) {
  if (n === 0) return "bg-stone-100";
  if (n <= 2) return "bg-red-200";
  if (n <= 5) return "bg-red-400";
  if (n <= 10) return "bg-red-500";
  return "bg-red-700";
}

function Heatmap({ days }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const cols = [];
    for (let w = 11; w >= 0; w--) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + (6 - d)));
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        col.push({ key, n: days[key] || 0, future: date > today });
      }
      cols.push(col);
    }
    return cols;
  }, [days]);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[420px] gap-1">
        {weeks.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.n} lượt`}
                className={cx(
                  "h-3 w-3 rounded-[3px]",
                  cell.future ? "bg-stone-50" : heatColor(cell.n)
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-stone-500">
        <span className="mr-1">Ít</span>
        {[0, 2, 5, 10].map((n) => (
          <span key={n} className={cx("h-2.5 w-2.5 rounded-[3px]", heatColor(n))} />
        ))}
        <span className="ml-1">Nhiều</span>
      </div>
    </div>
  );
}

// ---- ôn tập từ hay sai ----
function Review({ entries, onDone }) {
  const [queue, setQueue] = useState(() => shuffleArr(entries.map(([wk]) => wk)));
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const wk = queue[i];

  if (!wk) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-medium text-emerald-800">
        Ôn tập xong! 🎉
        <button
          type="button"
          onClick={onDone}
          className="mt-2 block w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const d = describeWrong(wk);
  const advance = () => {
    setShow(false);
    setI((x) => x + 1);
  };
  const remember = () => {
    markRemembered(wk);
    advance();
  };
  const forget = () => {
    setQueue((q) => [...q, wk]);
    advance();
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
        <span>
          Câu <b className="text-stone-800">{i + 1}</b>/{queue.length}
        </span>
        <button type="button" onClick={onDone} className="underline transition hover:text-red-700">
          Kết thúc
        </button>
      </div>
      <div
        onClick={() => setShow(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShow(true);
          }
        }}
        className={cx(
          "flex min-h-[8rem] cursor-pointer select-none flex-col items-center justify-center rounded-2xl border-2 px-4 py-6 text-center transition duration-150",
          show ? "border-emerald-400 bg-emerald-50/60" : "border-stone-200 bg-white hover:border-stone-300"
        )}
      >
        <div className="break-words text-4xl font-bold leading-tight text-stone-900 sm:text-5xl" style={JP}>
          {d.jp}
        </div>
        {show ? (
          <div className="mt-3 space-y-1">
            {d.sub && (
              <div className="break-words text-base font-medium text-red-700 sm:text-lg" style={JP}>
                {d.sub}
              </div>
            )}
            {d.vi && <div className="break-words text-sm text-stone-700 sm:text-base">{d.vi}</div>}
          </div>
        ) : (
          <div className="mt-2 text-xs text-stone-400">Chạm để xem đáp án</div>
        )}
      </div>
      {show && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={forget}
            className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
          >
            Chưa nhớ
          </button>
          <button
            type="button"
            onClick={remember}
            className="rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            Đã nhớ ✓
          </button>
        </div>
      )}
    </div>
  );
}

function shuffleArr(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function Bar({ label, value, total, color = "bg-red-500" }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="tabular-nums text-stone-500">
          {value}/{total} · {pct}%
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className={cx("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Công tắc bật/tắt kiểu hệ thống (iOS/Android)
function Switch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cx(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        on ? "bg-red-600" : "bg-stone-300"
      )}
    >
      <span
        className={cx(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          on && "translate-x-5"
        )}
      />
    </button>
  );
}

// Mũi tên phải (mở rộng) / xoay lên khi đang mở
function Chev({ up }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cx("h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200", up && "rotate-90")}
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Một dòng trong nhóm cài đặt: icon + nhãn (hoặc mô tả) bên trái, điều khiển bên phải
function Row({ icon, label, desc, onClick, right, danger }) {
  const inner = (
    <>
      {icon && <span aria-hidden="true" className="w-5 shrink-0 text-center text-base leading-none">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-sm font-medium", danger ? "text-red-600" : "text-stone-800")}>
          {label}
        </span>
        {desc && <span className="mt-0.5 block truncate text-xs text-stone-400">{desc}</span>}
      </span>
      {right}
    </>
  );
  const cls =
    "flex w-full items-center gap-3 border-t border-stone-100 px-4 py-3.5 text-left transition first:border-t-0";
  return onClick ? (
    <button type="button" onClick={onClick} className={cx(cls, "hover:bg-stone-50 active:bg-stone-100")}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default function Progress() {
  const p = useProfile();
  const [reviewing, setReviewing] = useState(false);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [goalOpen, setGoalOpen] = useState(false);

  const streak = calcStreak(p.days);
  const studySec = p.timeSec?.[todayStr()] || 0;
  const studyMin = Math.round(studySec / 60);
  const todayN = p.days[todayStr()] || 0;
  const goal = p.settings.goal || 10;
  const goalPct = Math.min(100, Math.round((todayN / goal) * 100));

  const stats = Object.entries(p.stats).filter(([, s]) => s.total > 0);
  const totalOk = stats.reduce((a, [, s]) => a + s.ok, 0);
  const totalAll = stats.reduce((a, [, s]) => a + s.total, 0);
  const acc = totalAll > 0 ? Math.round((totalOk / totalAll) * 100) : 0;

  const knownV = Object.keys(p.known.vocab || {}).length;
  const knownK = Object.keys(p.known.kanji || {}).length;

  const wrongEntries = Object.entries(p.wrong).sort((a, b) => b[1] - a[1]);

  const onExport = () => {
    try {
      const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "kanalearn-progress.json";
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg("Đã xuất file tiến độ ✓");
    } catch {
      setMsg("Xuất file thất bại");
    }
  };

  const onImportFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        importP(JSON.parse(r.result));
        setMsg("Đã nhập tiến độ ✓");
      } catch {
        setMsg("File không hợp lệ");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const onReset = () => {
    if (window.confirm("Xóa toàn bộ tiến độ học tập trên máy này?")) {
      resetP();
      setMsg("Đã xóa tiến độ");
    }
  };

  return (
    <div style={JP} className="space-y-5">
      {/* Streak + mục tiêu hôm nay */}
      <section className="fade-up rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-50">
            <span className="text-xl leading-none">🔥</span>
            <span className="mt-0.5 text-lg font-bold leading-none text-red-700 tabular-nums">{streak}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-stone-900">Hôm nay</span>
              <span className="text-xs tabular-nums text-stone-500">
                {todayN}/{goal} lượt
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className={cx(
                  "h-full rounded-full transition-all duration-500",
                  goalPct >= 100 ? "bg-emerald-500" : "bg-red-500"
                )}
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-stone-500">
              {goalPct >= 100 ? "Hoàn thành mục tiêu hôm nay! 🎉" : `Còn ${Math.max(0, goal - todayN)} lượt để đạt mục tiêu`}
              {studyMin > 0 && <span className="ml-1">· ⏱ Đã học {studyMin} phút hôm nay</span>}
            </p>
          </div>
        </div>
      </section>

      {/* Thống kê */}
      <section className="fade-up delay-1 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Kết quả luyện tập</h3>
        {totalAll === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            Chưa có dữ liệu — hãy làm vài câu trắc nghiệm để bắt đầu theo dõi tiến độ.
          </p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-stone-50 py-3">
                <div className="text-xl font-bold tabular-nums text-stone-900">{totalAll}</div>
                <div className="text-[11px] text-stone-500">câu đã làm</div>
              </div>
              <div className="rounded-xl bg-stone-50 py-3">
                <div className="text-xl font-bold tabular-nums text-emerald-600">{acc}%</div>
                <div className="text-[11px] text-stone-500">độ chính xác</div>
              </div>
              <div className="rounded-xl bg-stone-50 py-3">
                <div className="text-xl font-bold tabular-nums text-stone-900">{knownV + knownK}</div>
                <div className="text-[11px] text-stone-500">mục đã thuộc</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {stats.map(([sec, s]) => (
                <Bar
                  key={sec}
                  label={SEC_LABEL[sec] || sec}
                  value={s.ok}
                  total={s.total}
                  color={s.ok / s.total >= 0.85 ? "bg-emerald-500" : "bg-red-500"}
                />
              ))}
            </div>
          </>
        )}
        <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <Bar label="Từ vựng đã thuộc" value={knownV} total={vocabList.length} color="bg-amber-500" />
          <Bar label="Hán tự đã thuộc" value={knownK} total={kanjiList.length} color="bg-blue-500" />
        </div>
      </section>

      {/* Heatmap */}
      <section className="fade-up delay-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Hoạt động 12 tuần</h3>
        <div className="mt-3">
          <Heatmap days={p.days} />
        </div>
      </section>

      {/* Thành tựu */}
      <AchievementsPanel />

      {/* Từ hay sai */}
      {wrongEntries.length > 0 && (
        <section className="fade-up delay-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
              Từ hay sai ({wrongEntries.length})
            </h3>
            {!reviewing && (
              <button
                type="button"
                onClick={() => setReviewing(true)}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 active:scale-95"
              >
                Ôn tập ngay
              </button>
            )}
          </div>
          <div className="mt-3">
            {reviewing ? (
              <Review entries={wrongEntries} onDone={() => setReviewing(false)} />
            ) : (
              <ul className="space-y-1.5">
                {wrongEntries.slice(0, 8).map(([wk, n]) => {
                  const d = describeWrong(wk);
                  const sec = wk.slice(0, wk.indexOf(":"));
                  return (
                    <li
                      key={wk}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <span className="break-words text-base font-semibold text-stone-900" style={JP}>
                          {d.jp}
                        </span>
                        {d.sub && (
                          <span className="ml-2 break-words text-sm text-red-700" style={JP}>
                            {d.sub}
                          </span>
                        )}
                        {d.vi && <span className="ml-2 text-xs text-stone-500">— {d.vi}</span>}
                      </div>
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-red-700">
                        sai ×{n}
                      </span>
                      <span className="hidden shrink-0 text-[10px] text-stone-400 sm:block">
                        {SEC_LABEL[sec] || sec}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Cài đặt */}
      <section className="fade-up delay-4">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Cài đặt</h3>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        {/* Học tập */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Học tập
          </div>
          <Row
            icon="🎯"
            label="Mục tiêu mỗi ngày"
            onClick={() => setGoalOpen((v) => !v)}
            right={
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-stone-500">
                {goal} lượt
                <Chev up={goalOpen} />
              </span>
            }
          />
          {goalOpen && (
            <div className="grid grid-cols-4 gap-2 border-t border-stone-100 bg-stone-50/70 px-4 py-3">
              {[5, 10, 20, 50].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setSetting("goal", g);
                    setGoalOpen(false);
                  }}
                  className={cx(
                    "rounded-lg border py-2 text-sm font-semibold transition duration-150 active:scale-95",
                    goal === g
                      ? "border-red-600 bg-red-600 text-white shadow-sm"
                      : "border-stone-200 bg-white text-stone-600 hover:border-red-300 hover:text-red-700"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Thông báo */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Thông báo
          </div>
          <Row
            icon="✨"
            label="Hiệu ứng thành tựu"
            desc="Bay vào và phát sáng khi mở khóa"
            right={
              <Switch
                on={!!p.settings.achFx}
                label="Hiệu ứng thành tựu"
                onChange={() => setSetting("achFx", !p.settings.achFx)}
              />
            }
          />
          <Row
            icon="🔔"
            label="Âm thanh"
            desc="Tiếng báo khi có thành tựu mới"
            right={
              <Switch
                on={!!p.settings.achSfx}
                label="Âm thanh"
                onChange={() => setSetting("achSfx", !p.settings.achSfx)}
              />
            }
          />
        </div>

        {/* Dữ liệu */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Dữ liệu
          </div>
          <Row icon="⬇️" label="Xuất tiến độ" desc="Tải file JSON về máy" onClick={onExport} right={<Chev />} />
          <Row
            icon="⬆️"
            label="Nhập tiến độ"
            desc="Nạp từ file JSON đã xuất"
            onClick={() => fileRef.current?.click()}
            right={<Chev />}
          />
          <Row icon="🗑️" label="Xoá toàn bộ tiến độ" danger onClick={onReset} right={<Chev />} />
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
        </div>

        {msg && <p className="mt-3 text-center text-xs text-emerald-700">{msg}</p>}
      </section>
    </div>
  );
}

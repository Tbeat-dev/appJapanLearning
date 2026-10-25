// Thông báo thành tựu khi mở khóa + bảng thành tựu trong trang Tiến độ.
import { useEffect, useState } from "react";
import { useProfile, dismissFresh } from "../lib/progress.js";
import { ACH, CATS, metrics, isDone, levelInfo, totalPoints } from "../lib/achievementData.js";

const byId = Object.fromEntries(ACH.map((a) => [a.id, a]));

// Hiệu ứng của thẻ thông báo
const FX = `
@keyframes ach-pop { 0% { opacity: 0; transform: translateY(-20px) scale(.94); }
  60% { opacity: 1; transform: translateY(4px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes ach-ico { 0% { transform: scale(.4) rotate(-18deg); }
  70% { transform: scale(1.25) rotate(6deg); }
  100% { transform: scale(1) rotate(0); } }
@keyframes ach-glow { 0%, 100% { box-shadow: 0 10px 26px -14px rgba(245,158,11,.75); }
  50% { box-shadow: 0 12px 30px -10px rgba(245,158,11,.95); } }
.ach-pop { animation: ach-pop .42s cubic-bezier(.2,.8,.3,1.15) both, ach-glow 2s ease-in-out .42s infinite; }
.ach-pop .ach-ico { display: inline-block; animation: ach-ico .6s ease .08s both; }
@media (prefers-reduced-motion: reduce) { .ach-pop, .ach-pop .ach-ico { animation: none; } }
`;

// Chuông ngắn hai nốt, chỉ phát khi người dùng bật "Âm thanh" trong Cài đặt
let actx = null;
function chime() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  actx = actx || new AC();
  if (actx.state === "suspended") actx.resume();
  const t0 = actx.currentTime;
  [
    [880, 0],
    [1318.5, 0.11],
  ].forEach(([f, d]) => {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + d);
    g.gain.exponentialRampToValueAtTime(0.1, t0 + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.4);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t0 + d);
    o.stop(t0 + d + 0.45);
  });
}

// Đặt một lần ở LearnApp: hiện thẻ nổi dưới đáy màn hình khi có thành tựu mới
export function AchievementToast() {
  const p = useProfile();
  const fresh = p.fresh || [];
  const fx = !!p.settings.achFx;
  const sfx = !!p.settings.achSfx;
  const sig = fresh.join("|");

  useEffect(() => {
    if (!sig) return;
    const t = setTimeout(dismissFresh, 4500);
    return () => clearTimeout(t);
  }, [sig]);

  useEffect(() => {
    if (!sig || !sfx) return;
    try {
      chime();
    } catch (e) {
      /* trình duyệt chặn âm thanh */
    }
  }, [sig, sfx]);

  if (!fresh.length) return null;
  const shown = fresh.slice(-3).map((id) => byId[id]).filter(Boolean);

  // z-80: cao hơn lớp phủ chế độ Tập trung (z-60) và hộp thoại thiết lập (z-70)
  // Gắn mép trên, dưới thanh header dính (sticky, ~57px) — tránh che điều hướng đáy
  return (
    <div
      className="pointer-events-none fixed top-[calc(64px+env(safe-area-inset-top))] left-1/2 z-[80] w-[92%] max-w-sm -translate-x-1/2 space-y-2"
      role="status"
      aria-live="polite"
    >
      <style>{FX}</style>
      {shown.map((a) => (
        <div
          key={a.id}
          className={`pointer-events-none relative flex items-center gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 shadow-lg ${fx ? "ach-pop" : ""}`}
        >
          <button
            type="button"
            onClick={dismissFresh}
            aria-label="Đóng thông báo"
            className="pointer-events-auto absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-900 shadow hover:bg-amber-500"
          >
            ✕
          </button>
          <div className="ach-ico text-3xl">{a.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-amber-700">🏆 Thành tựu mới · +{a.pts} điểm</div>
            <div className="font-bold">{a.name}</div>
            <div className="text-xs text-stone-600">{a.desc}</div>
          </div>
        </div>
      ))}
      {fresh.length > 3 && <div className="text-center text-xs text-stone-500">và {fresh.length - 3} thành tựu khác</div>}
    </div>
  );
}

const chip = (on) =>
  `rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition ${
    on ? "border-red-600 bg-red-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-red-200 hover:bg-red-50/40"
  }`;

export function AchievementsPanel() {
  const p = useProfile();
  const [cat, setCat] = useState("Tất cả");
  const [only, setOnly] = useState("all"); // all | done | todo
  const m = metrics(p);
  const done = ACH.filter((a) => p.ach && p.ach[a.id]);
  const pts = totalPoints(p);
  const lv = levelInfo(pts);
  const pct = (a) => Math.min(100, Math.round((Math.min(a.get(m), a.target) / a.target) * 100));
  let list = ACH.filter((a) => cat === "Tất cả" || a.cat === cat).filter((a) => {
    const d = !!(p.ach && p.ach[a.id]);
    return only === "all" ? true : only === "done" ? d : !d;
  });
  if (only === "todo") list = [...list].sort((a, b) => pct(b) - pct(a));

  return (
    <section className="fade-up delay-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-2xl font-bold text-amber-800">
          {lv.level}
        </div>
        <div className="flex-1">
          <div className="font-semibold">
            Cấp {lv.level} · {lv.title}
          </div>
          <div className="my-1 h-2.5 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full bg-amber-500" style={{ width: `${lv.pct}%` }} />
          </div>
          <div className="text-xs text-stone-500">
            {pts} điểm · còn {lv.to - pts} điểm để lên cấp {lv.level + 1}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
          Thành tựu ({done.length}/{ACH.length})
        </h3>
        <div className="flex gap-1 text-xs">
          {[
            ["all", "Tất cả"],
            ["done", "Đã mở"],
            ["todo", "Chưa mở"],
          ].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setOnly(k)}
              className={`rounded-md px-2.5 py-1 whitespace-nowrap ${
                only === k ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {["Tất cả", ...CATS].map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={chip(cat === c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {list.map((a) => {
          const at = p.ach && p.ach[a.id];
          const hint = a.hint && a.hint(m);
          return (
            <div
              key={a.id}
              className={`flex gap-3 rounded-xl border p-3 ${at ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-stone-50"}`}
            >
              <div className={`w-10 text-center text-3xl ${at ? "" : "opacity-50 grayscale"}`}>{a.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-semibold">{a.name}</span>
                  <span className="text-xs text-stone-500">{a.pts}đ</span>
                </div>
                <div className="text-xs text-stone-600">{a.desc}</div>
                {at ? (
                  <div className="mt-1 text-xs text-amber-700">
                    ✓ Mở ngày {new Date(at).toLocaleDateString("vi-VN")}
                  </div>
                ) : (
                  <div className="mt-1.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                      <div className="h-full bg-red-500" style={{ width: `${pct(a)}%` }} />
                    </div>
                    <div className="mt-0.5 text-xs text-stone-500">
                      {hint || `${Math.min(a.get(m), a.target)}${a.unit || ""}/${a.target}${a.unit || ""}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <p className="col-span-full py-4 text-center text-sm text-stone-500">Không có thành tựu nào ở mục này.</p>
        )}
      </div>
    </section>
  );
}

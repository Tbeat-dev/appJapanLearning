import { useEffect, useState } from "react";
import Progress from "./Progress.jsx";
import SyncSection from "./SyncSection.jsx";

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

const AVATARS = ["🇯🇵", "⛩️", "🌸", "🦊", "🐱", "🗡️", "🎯", "📚", "🍜", "🚀", "🎧", "✨"];

const GOALS = [
  { id: "n5", label: "JLPT N5", desc: "Từ vựng & chữ cái cơ bản" },
  { id: "n4", label: "JLPT N4", desc: "Mở rộng từ vựng, grammar" },
  { id: "n3", label: "JLPT N3", desc: "Đọc hiểu trung cấp" },
  { id: "talk", label: "Giao tiếp", desc: "Nghe nói hằng ngày" },
];

const LEVELS = [
  { id: "new", label: "Mới bắt đầu", desc: "Chưa biết gì" },
  { id: "basic", label: "Đã biết Kana", desc: "Hiragana/Katakana" },
  { id: "some", label: "Đã học vài tháng", desc: "Cơ bản sơ khai" },
];

const DAY_GOALS = [10, 15, 20, 30];

const KEY = "kanalearn.profile";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

const goalLabel = (id) => GOALS.find((g) => g.id === id)?.label;
const levelLabel = (id) => LEVELS.find((l) => l.id === id)?.label;

function ProfileCard({ p, onLearn, onEdit, compact }) {
  return (
    <section className="fade-up overflow-hidden rounded-2xl border-2 border-stone-900 bg-stone-900 p-5 text-white shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">Hồ sơ của bạn</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-stone-200 transition hover:bg-white/10 active:scale-95"
          >
            ✏️ Chỉnh sửa
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-700 text-2xl shadow-sm"
        >
          {p.avatar || "🇯🇵"}
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold">{p.name ? `Chào, ${p.name}!` : "Chưa có tên"}</div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
            {p.goal && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 font-semibold">{goalLabel(p.goal)}</span>
            )}
            {p.level && <span className="rounded-full bg-white/10 px-2 py-0.5">{levelLabel(p.level)}</span>}
            {p.daily && <span className="rounded-full bg-white/10 px-2 py-0.5">{p.daily} phút/ngày</span>}
          </div>
        </div>
      </div>
      {!compact && (
        <button
          type="button"
          onClick={onLearn}
          className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-red-700 active:scale-[0.99]"
        >
          Bắt đầu học theo mục tiêu →
        </button>
      )}
    </section>
  );
}

export default function Profile({ onLearn, syncCode, onSyncConsumed }) {
  const [p, setP] = useState(() => load());
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* ignore quota */
    }
  }, [p]);

  const set = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setSaved(true);
  };

  const done = !!(p.name && p.avatar && p.goal && p.level && p.daily);
  // Hồ sơ đã hoàn tất → mặc định xem, chỉ vào chế độ sửa khi bấm Chỉnh sửa
  const viewMode = done && !editing;

  if (viewMode) {
    return (
      <div style={JP}>
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Hồ sơ
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Xin chào, {p.name} 👋
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-stone-600">
              Theo dõi tiến độ và huy hiệu của bạn — mọi dữ liệu lưu ngay trên máy.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:max-w-4xl">
          <ProfileCard p={p} onLearn={onLearn} onEdit={() => setEditing(true)} />

          {syncCode && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              🔗 Nhận mã đồng bộ từ thiết bị khác — cuộn xuống mục “Đồng bộ &amp; sao lưu” để gộp.
            </p>
          )}

          <section className="fade-up delay-1">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">Tiến độ học tập</h2>
              <div className="h-px flex-1 bg-stone-200" />
            </div>
            <Progress />
          </section>

          <SyncSection incomingCode={syncCode} onConsumed={onSyncConsumed} />
        </div>
      </div>
    );
  }

  return (
    <div style={JP}>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              Cá nhân hóa
            </span>
            {done && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 active:scale-95"
              >
                ← Xem hồ sơ
              </button>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Chỉnh sửa hồ sơ</h1>
          <p className="mt-1.5 text-sm leading-snug text-stone-600">
            Chọn mục tiêu và phong cách học — app ghi nhớ ngay trên máy bạn, không cần đăng nhập.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:max-w-4xl">
        {/* Avatar + tên */}
        <section className="fade-up rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">1 · Hình đại diện & tên</h2>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Chọn avatar">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={p.avatar === a}
                onClick={() => set("avatar", a)}
                className={cx(
                  "flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition duration-150 active:scale-95",
                  p.avatar === a
                    ? "border-red-500 bg-red-50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-red-200 hover:bg-red-50/50"
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            value={p.name || ""}
            onChange={(e) => set("name", e.target.value.slice(0, 30))}
            placeholder="Tên của bạn (vd: Thịnh)"
            maxLength={30}
            className="mt-4 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </section>

        {/* Mục tiêu */}
        <section className="fade-up delay-1 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">2 · Mục tiêu học</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => set("goal", g.id)}
                className={cx(
                  "rounded-xl border p-3.5 text-left transition duration-150 active:scale-[0.98]",
                  p.goal === g.id
                    ? "border-red-500 bg-red-50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                )}
              >
                <div className="text-sm font-bold text-stone-900">{g.label}</div>
                <div className="mt-0.5 text-xs text-stone-500">{g.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Trình độ */}
        <section className="fade-up delay-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">3 · Trình độ hiện tại</h2>
          <div className="mt-3 flex flex-col gap-2">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => set("level", l.id)}
                className={cx(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition duration-150 active:scale-[0.98]",
                  p.level === l.id
                    ? "border-red-500 bg-red-50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                )}
              >
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{l.label}</span>
                  <span className="block text-xs text-stone-500">{l.desc}</span>
                </span>
                {p.level === l.id && <span className="text-red-600">✓</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Thời gian */}
        <section className="fade-up delay-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">4 · Mỗi ngày học bao lâu?</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {DAY_GOALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("daily", m)}
                className={cx(
                  "flex flex-col items-center rounded-xl border py-3 transition duration-150 active:scale-95",
                  p.daily === m
                    ? "border-red-500 bg-red-50 shadow-sm"
                    : "border-stone-200 bg-white hover:border-red-200 hover:bg-red-50/40"
                )}
              >
                <span className="text-lg font-bold text-stone-900">{m}</span>
                <span className="text-[10px] text-stone-500">phút</span>
              </button>
            ))}
          </div>
        </section>

        {/* Hoàn thành */}
        <section className="fade-up delay-4">
          {done ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-800">✓ Hồ sơ đã hoàn tất</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                >
                  Xem hồ sơ & tiến độ →
                </button>
                <button
                  type="button"
                  onClick={() => onLearn?.()}
                  className="flex-1 rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 active:scale-[0.98]"
                >
                  Bắt đầu học →
                </button>
              </div>
              {saved && <p className="mt-2 text-[11px] text-emerald-600">✓ Tự lưu trên máy bạn</p>}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
              <p className="text-sm text-stone-500">Hoàn thành 4 bước ở trên để lưu hồ sơ.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

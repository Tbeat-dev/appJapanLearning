const cx = (...a) => a.filter(Boolean).join(" ");

export const PROFILE_KEY = "kanalearn.profile";

export const AVATARS = ["🇯🇵", "⛩️", "🌸", "🦊", "🐱", "🗡️", "🎯", "📚", "🍜", "🚀", "🎧", "✨"];

export const GOALS = [
  { id: "n5", label: "JLPT N5", desc: "Từ vựng & chữ cái cơ bản" },
  { id: "n4", label: "JLPT N4", desc: "Mở rộng từ vựng, grammar" },
  { id: "n3", label: "JLPT N3", desc: "Đọc hiểu trung cấp" },
  { id: "talk", label: "Giao tiếp", desc: "Nghe nói hằng ngày" },
];

export const LEVELS = [
  { id: "new", label: "Mới bắt đầu", desc: "Chưa biết gì" },
  { id: "basic", label: "Đã biết Kana", desc: "Hiragana/Katakana" },
  { id: "some", label: "Đã học vài tháng", desc: "Cơ bản sơ khai" },
];

export const DAY_GOALS = [10, 15, 20, 30];

export const goalLabel = (id) => GOALS.find((g) => g.id === id)?.label;
export const levelLabel = (id) => LEVELS.find((l) => l.id === id)?.label;

export const loadProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
};

export const saveProfile = (p) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    // Báo cho các nơi đang hiển thị hồ sơ (vd: thanh trên cùng) cập nhật lại
    window.dispatchEvent(new Event("profile:updated"));
  } catch {
    /* ignore quota */
  }
};

export const profileDone = (p) => !!(p && p.name && p.avatar && p.goal && p.level && p.daily);

// 4 bước lập hồ sơ + khối xác nhận — dùng chung cho trang Hồ sơ và popup mở đầu
// compact: dạng các trường phẳng trong khung đăng nhập (không có nền/thẻ lồng nhau)
export default function ProfileSetup({ p, set, done, saved, onView, onLearn, actions = true, compact = false }) {
  const box = (delay = "") =>
    compact
      ? "fade-up space-y-5 border-b border-stone-100 pb-5 last:border-0 last:pb-0"
      : `fade-up ${delay} rounded-2xl border border-stone-200 bg-white p-5 shadow-sm`;
  return (
    <>
      {/* Avatar + tên */}
      <section className={box()}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">1 · Hình đại diện &amp; tên</h2>
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
      <section className={box("delay-1")}>
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
      <section className={box("delay-2")}>
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
      <section className={box("delay-3")}>
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
      <section className={compact ? "fade-up" : "fade-up delay-4"}>
        {done ? (
          compact ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-emerald-600">✓ Hồ sơ đã hoàn tất</p>
              {saved && <p className="mt-1 text-[11px] text-emerald-600">✓ Tự lưu trên máy bạn</p>}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-800">✓ Hồ sơ đã hoàn tất</p>
              {actions && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onView?.()}
                    className="flex-1 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                  >
                    Xem hồ sơ &amp; tiến độ →
                  </button>
                  <button
                    type="button"
                    onClick={() => onLearn?.()}
                    className="flex-1 rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 active:scale-[0.98]"
                  >
                    Bắt đầu học →
                  </button>
                </div>
              )}
              {saved && <p className="mt-2 text-[11px] text-emerald-600">✓ Tự lưu trên máy bạn</p>}
            </div>
          )
        ) : compact ? (
          <p className="text-center text-xs text-stone-400">Điền đủ 4 bước để mở app</p>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-sm text-stone-500">Hoàn thành 4 bước ở trên để lưu hồ sơ.</p>
          </div>
        )}
      </section>
    </>
  );
}

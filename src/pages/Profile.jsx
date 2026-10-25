import { useEffect, useState } from "react";
import Progress from "./Progress.jsx";
import SyncSection from "./SyncSection.jsx";
import ProfileSetup, { loadProfile, profileDone, saveProfile, goalLabel, levelLabel } from "../components/ProfileSetup.jsx";

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

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
  const [p, setP] = useState(loadProfile);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    saveProfile(p);
  }, [p]);

  const set = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setSaved(true);
  };

  const done = profileDone(p);
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
        <ProfileSetup
          p={p}
          set={set}
          done={done}
          saved={saved}
          onView={() => setEditing(false)}
          onLearn={onLearn}
        />
      </div>
    </div>
  );
}

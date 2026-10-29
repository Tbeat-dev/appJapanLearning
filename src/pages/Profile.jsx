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
    <section className="fade-up overflow-hidden rounded-2xl border-2 border-[var(--text)] bg-[var(--text)] p-5 text-[var(--bg)] shadow-md">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-faint)]">Hồ sơ của bạn</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-[var(--bg)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--bg)] transition hover:bg-[var(--bg)]/10 active:scale-95"
          >
            ✏️ Chỉnh sửa
          </button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-hover)] text-2xl shadow-sm"
        >
          {p.avatar || "🇯🇵"}
        </span>
        <div className="min-w-0">
          <div className="truncate text-lg font-bold">{p.name ? `Chào, ${p.name}!` : "Chưa có tên"}</div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
            {p.goal && (
              <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 font-semibold">{goalLabel(p.goal)}</span>
            )}
            {p.level && <span className="rounded-full bg-[var(--bg)]/10 px-2 py-0.5">{levelLabel(p.level)}</span>}
            {p.daily && <span className="rounded-full bg-[var(--bg)]/10 px-2 py-0.5">{p.daily} phút/ngày</span>}
          </div>
        </div>
      </div>
      {!compact && (
        <button
          type="button"
          onClick={onLearn}
          className="mt-4 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--on-brand)] transition duration-150 hover:bg-[var(--brand-hover)] active:scale-[0.99]"
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
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/25 bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
              Hồ sơ
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Xin chào, {p.name} 👋
            </h1>
            <p className="mt-1.5 text-sm leading-snug text-[var(--text-muted)]">
              Theo dõi tiến độ và huy hiệu của bạn — mọi dữ liệu lưu ngay trên máy.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:max-w-4xl">
          <ProfileCard p={p} onLearn={onLearn} onEdit={() => setEditing(true)} />

          {syncCode && (
            <p className="rounded-2xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">
              🔗 Nhận mã đồng bộ từ thiết bị khác — cuộn xuống mục “Đồng bộ &amp; sao lưu” để gộp.
            </p>
          )}

          <section className="fade-up delay-1">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">Tiến độ học tập</h2>
              <div className="h-px flex-1 bg-[var(--surface-2)]" />
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
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/25 bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
              Cá nhân hóa
            </span>
            {done && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-2)] active:scale-95"
              >
                ← Xem hồ sơ
              </button>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Chỉnh sửa hồ sơ</h1>
          <p className="mt-1.5 text-sm leading-snug text-[var(--text-muted)]">
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

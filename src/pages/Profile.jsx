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
    <section className="fade-up overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="eyebrow text-[var(--outline)]">Hồ sơ của bạn</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface-low)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-95"
          >
            Chỉnh sửa
          </button>
        )}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-3xl shadow-[var(--shadow-1)]"
        >
          {p.avatar || "🇯🇵"}
        </span>
        <div className="min-w-0">
          <div className="font-display truncate text-xl font-semibold text-[var(--text)]">
            {p.name ? `Chào, ${p.name}!` : "Chưa đặt tên"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
            {p.goal && <span className="font-semibold text-[var(--brand-deep)]">{goalLabel(p.goal)}</span>}
            {p.goal && p.level && <span aria-hidden="true">·</span>}
            {p.level && <span>{levelLabel(p.level)}</span>}
            {p.daily && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular">{p.daily} phút/ngày</span>
              </>
            )}
          </div>
        </div>
      </div>
      {!compact && (
        <button
          type="button"
          onClick={onLearn}
          className="mt-5 min-h-12 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--on-brand)] shadow-[var(--shadow-1)] transition duration-150 hover:bg-[var(--brand-hover)] active:scale-[0.99]"
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
      <div style={JP} className="space-y-6">
        <header>
          <p className="eyebrow text-[var(--brand-deep)]">Hồ sơ</p>
          <h1 className="font-display mt-1 text-[var(--fs-h1)] font-semibold tracking-tight text-[var(--text)]">
            Xin chào, {p.name}
          </h1>
          <p className="mt-1.5 text-sm leading-snug text-[var(--text-muted)]">
            Theo dõi tiến độ và huy hiệu của bạn — mọi dữ liệu lưu ngay trên máy.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-5">
            <ProfileCard p={p} onLearn={onLearn} onEdit={() => setEditing(true)} />
            {syncCode && (
              <p className="rounded-2xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">
                Nhận mã đồng bộ từ thiết bị khác — dùng mục “Đồng bộ &amp; sao lưu” bên dưới để gộp.
              </p>
            )}
            <SyncSection incomingCode={syncCode} onConsumed={onSyncConsumed} />
          </div>

          <section className="fade-up delay-1 lg:col-span-7">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="eyebrow text-[var(--outline)]">Tiến độ học tập</h2>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <Progress />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div style={JP} className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow text-[var(--brand-deep)]">Cá nhân hóa</p>
          {done && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="min-h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-low)] active:scale-95"
            >
              ← Xem hồ sơ
            </button>
          )}
        </div>
        <h1 className="font-display mt-1 text-[var(--fs-h1)] font-semibold tracking-tight text-[var(--text)]">
          Chỉnh sửa hồ sơ
        </h1>
        <p className="mt-1.5 text-sm leading-snug text-[var(--text-muted)]">
          Chọn mục tiêu và phong cách học — app ghi nhớ ngay trên máy bạn, không cần đăng nhập.
        </p>
      </header>

      <ProfileSetup
        p={p}
        set={set}
        done={done}
        saved={saved}
        onView={() => setEditing(false)}
        onLearn={onLearn}
      />
    </div>
  );
}

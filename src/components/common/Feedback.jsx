import { Check, X, Inbox } from "lucide-react";
import Button from "./Button.jsx";

const cx = (...a) => a.filter(Boolean).join(" ");

/** Skeleton — dùng khi tải, không dùng vòng quay trơ trọi. */
export function Skeleton({ className = "", lines = 0 }) {
  return (
    <div className={cx("animate-pulse space-y-3", className)} aria-hidden="true">
      <div className="h-6 w-2/5 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 w-full rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
      ))}
      <div className="h-20 w-full rounded-[var(--radius-lg)] bg-[var(--surface-2)]" />
    </div>
  );
}

/** Trạng thái rỗng: biểu tượng + một câu + một nút hành động. */
export function EmptyState({ title, hint, actionLabel, onAction, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <Icon aria-hidden="true" className="h-8 w-8 text-[var(--text-faint)]" strokeWidth={1.5} />
      <p className="text-[var(--fs-h3)] font-semibold text-[var(--text)]">{title}</p>
      {hint && <p className="max-w-sm text-sm text-[var(--text-muted)]">{hint}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/** Phản hồi đúng/sai: luôn kèm biểu tượng + chữ, không chỉ màu. */
export function ResultFlag({ ok, label }) {
  const Icon = ok ? Check : X;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3 py-1 text-sm font-semibold",
        ok ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"
      )}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
      {label || (ok ? "Đúng" : "Chưa đúng")}
    </span>
  );
}

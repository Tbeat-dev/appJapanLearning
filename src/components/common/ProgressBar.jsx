const cx = (...a) => a.filter(Boolean).join(" ");

/** Thanh tiến độ cao 8px. Kèm số "12/20" ở dạng chữ (không chỉ %). */
export default function ProgressBar({ value, max = 100, label, color, className = "" }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const fill = color || "var(--brand)";
  return (
    <div className={cx("w-full", className)}>
      {(label || max > 0) && (
        <div className="mb-1 flex items-center justify-between text-[var(--fs-small)] text-[var(--text-muted)]">
          <span>{label}</span>
          <span aria-hidden="true">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label || "Tiến độ"}
        className="h-2 w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--surface-2)]"
      >
        <div
          className="h-full origin-left animate-grow-x rounded-[var(--radius-full)] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}

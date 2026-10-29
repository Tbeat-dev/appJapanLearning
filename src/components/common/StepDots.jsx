const cx = (...a) => a.filter(Boolean).join(" ");

/**
 * Tiến độ dạng node tròn: viền trong suốt cho phần chưa tới,
 * đặc màu cho phần đã xong, mờ cho mốc hiện tại.
 */
export default function StepDots({ value, max = 3, label, className = "" }) {
  return (
    <div className={cx("flex min-w-0 items-center gap-2", className)}>
      {label && (
        <span className="shrink-0 text-[var(--fs-small)] text-[var(--text-muted)]">{label}</span>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label || "Tiến độ"}
        className="flex min-w-0 items-center gap-1 sm:gap-1.5"
      >
        {Array.from({ length: max }, (_, i) => {
          const done = i < value - 1;
          const current = i === value - 1;
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cx(
                "h-2 w-2 shrink-0 rounded-full border-2 transition-colors duration-200 sm:h-2.5 sm:w-2.5",
                done && "border-[var(--brand)] bg-[var(--brand)]",
                current && "border-[var(--brand)] bg-[var(--brand)]/35",
                !done && !current && "border-[var(--border)] bg-transparent"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

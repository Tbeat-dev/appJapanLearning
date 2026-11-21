const cx = (...a) => a.filter(Boolean).join(" ");

/** Chip lọc tương tác: chọn thì nền brand chữ trắng. */
export function Chip({ selected, children, className = "", ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      className={cx(
        "inline-flex min-h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition-colors duration-150",
        selected
          ? "bg-[var(--brand-deep)] font-semibold text-[var(--on-brand)] shadow-[var(--shadow-1)]"
          : "bg-[var(--surface-2)] font-medium text-[var(--text-muted)] hover:bg-[var(--surface-high)] hover:text-[var(--text)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

const LEVEL = {
  N5: "bg-[var(--n5-soft)] text-[var(--n5)]",
  N4: "bg-[var(--n4-soft)] text-[var(--n4)]",
  N3: "bg-[var(--n3-soft)] text-[var(--n3)]",
};

/** Nhãn cấp độ JLPT gọn — không viền dày. */
export function LevelBadge({ level = "N5", className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide",
        LEVEL[level] || LEVEL.N5,
        className
      )}
    >
      {level}
    </span>
  );
}

/** Thanh phân đoạn: nền surface-2, mục chọn nền surface chữ brand. */
export function Segmented({ options, value, onChange, className = "", ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        "no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[var(--surface-2)] p-1",
        className
      )}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "min-h-10 shrink-0 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition duration-150",
              on
                ? "bg-[var(--surface)] text-[var(--brand)] shadow-[var(--shadow-1)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

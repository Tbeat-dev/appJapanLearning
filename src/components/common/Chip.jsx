const cx = (...a) => a.filter(Boolean).join(" ");

/** Chip lọc: viên thuốc; chọn thì nền brand chữ trắng. */
export function Chip({ selected, children, className = "", ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      className={cx(
        "inline-flex h-9 shrink-0 items-center rounded-[var(--radius-full)] border px-3.5 text-sm font-medium transition duration-150",
        selected
          ? "border-transparent bg-[var(--brand)] text-[var(--on-brand)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]",
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

/** Nhãn cấp độ JLPT — chỉ dùng màu N5/N4/N3. */
export function LevelBadge({ level = "N5", className = "" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[var(--radius-full)] px-2 py-0.5 text-[var(--fs-tiny)] font-semibold",
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
        "no-scrollbar flex gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--surface-2)] p-1",
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
              "min-h-10 shrink-0 rounded-[var(--radius-sm)] px-3.5 text-sm font-semibold transition duration-150",
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

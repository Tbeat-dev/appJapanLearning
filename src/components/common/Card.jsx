const cx = (...a) => a.filter(Boolean).join(" ");

/** Thẻ nền surface, viền 1px, bo 16px. */
export default function Card({ className = "", as: As = "div", ...rest }) {
  return (
    <As
      className={cx(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]",
        className
      )}
      {...rest}
    />
  );
}

const cx = (...a) => a.filter(Boolean).join(" ");

/** Thẻ nền surface, bo 16px, viền mảnh và bóng nhẹ. */
export default function Card({ className = "", as: As = "div", ...rest }) {
  return (
    <As
      className={cx(
        "rounded-2xl border border-[var(--border)]/80 bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] sm:p-5",
        className
      )}
      {...rest}
    />
  );
}

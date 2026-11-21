const cx = (...a) => a.filter(Boolean).join(" ");

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition duration-150 ease-out select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const sizes = {
  md: "min-h-12 px-5 py-2.5 text-[15px] rounded-xl",
  sm: "min-h-10 px-3.5 py-2 text-sm rounded-xl",
  icon: "h-11 w-11 rounded-xl",
};

const variants = {
  primary: "bg-[var(--brand)] text-[var(--on-brand)] shadow-[var(--shadow-1)] hover:bg-[var(--brand-hover)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-low)]",
  soft: "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-high)]",
  text: "text-[var(--brand)] hover:bg-[var(--brand-soft)] px-3",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
};

/** Nút dùng chung. Vùng bấm ≥44px cho thao tác cảm ứng. */
export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={cx(base, sizes[size], variants[variant], className)}
      {...rest}
    />
  );
}

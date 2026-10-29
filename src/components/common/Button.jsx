const cx = (...a) => a.filter(Boolean).join(" ");

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition duration-150 ease-out select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const sizes = {
  md: "h-12 px-5 text-[15px] rounded-[var(--radius-md)]",
  sm: "h-10 px-3.5 text-sm rounded-[var(--radius-md)]",
  icon: "h-11 w-11 rounded-[var(--radius-md)]",
};

const variants = {
  primary: "bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)]",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]",
  text: "text-[var(--brand)] hover:bg-[var(--brand-soft)] px-3",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
};

/** Nút dùng chung. primary = mỗi màn hình tối đa một cái. Vùng bấm ≥44px. */
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

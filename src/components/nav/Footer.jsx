const YEAR = new Date().getFullYear();

/**
 * Chân trang giới thiệu tác giả — đặt gọn phía cuối trang Hôm nay.
 */
export default function Footer({ className = "" }) {
  return (
    <footer
      className={`relative z-10 mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-low)] px-5 py-6 text-center text-xs leading-relaxed text-[var(--text-muted)] sm:flex sm:items-center sm:justify-between sm:text-left ${className}`}
    >
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">Thái Quốc Thịnh</p>
        <p className="mt-0.5">Sinh viên năm 4 · Đại Học Khoa học Huế</p>
      </div>
      <div className="mt-3 flex flex-col items-center gap-1.5 sm:mt-0 sm:items-end">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a
            href="tel:0325745632"
            className="min-h-8 inline-flex items-center transition duration-150 hover:text-[var(--brand)]"
          >
            0325745632
          </a>
          <span aria-hidden="true" className="text-[var(--text-faint)]">·</span>
          <a
            href="mailto:quocthinh120805@gmail.com"
            className="min-h-8 inline-flex items-center transition duration-150 hover:text-[var(--brand)]"
          >
            quocthinh120805@gmail.com
          </a>
        </div>
        <p className="text-[var(--text-faint)]">
          HirataLearn · Tiếng Nhật N5 · {YEAR}
        </p>
      </div>
    </footer>
  );
}

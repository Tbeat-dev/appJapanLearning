const YEAR = new Date().getFullYear();

/**
 * Chân trang giới thiệu người tạo — giữ từ bản KanaLearn cũ.
 * Chỉ hiển thị ở trang Hôm nay, phía trên thanh điều hướng cố định.
 */
export default function Footer({ className = "" }) {
  return (
    <footer
      className={`relative z-10 mt-10 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-xs leading-relaxed text-[var(--text-muted)] sm:px-6 ${className}`}
    >
      <p className="text-sm font-semibold text-[var(--text)]">Thái Quốc Thịnh</p>
      <p>Sinh viên năm 4 · Đại Học Khoa học Huế</p>
      <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a
          href="tel:0325745632"
          className="transition duration-150 hover:text-[var(--brand)]"
        >
          📞 0325745632
        </a>
        <a
          href="mailto:quocthinh120805@gmail.com"
          className="transition duration-150 hover:text-[var(--brand)]"
        >
          ✉️ quocthinh120805@gmail.com
        </a>
      </p>
      <p className="mt-2 text-[var(--text-faint)]">
        HirataLearn · Học tiếng Nhật N5 · {YEAR}
      </p>
    </footer>
  );
}

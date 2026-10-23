const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

// Tin chính / bài viết ngắn về học tiếng Nhật
const ARTICLES = [
  {
    id: "jlpt-n5-roadmap",
    tag: "Lộ trình",
    date: "2026-10-20",
    title: "Lộ trình học JLPT N5 trong 3 tháng",
    excerpt:
      "Học 46 Hiragana + 46 Katakana tuần đầu, sau đó 100 từ vựng và 80 Hán tự N5. Dành 20–30 phút mỗi ngày là đủ.",
    body: [
      "Tuần 1–2: làm quen bảng chữ cái. Chạm từng ô để nghe, rồi dùng chế độ gõ romaji để kiểm tra phản xạ.",
      "Tuần 3–6: 100 từ vựng N5 theo chủ đề (gia đình, trường học, đồ ăn…). Dùng flashcard rồi chuyển sang trắc nghiệm.",
      "Tuần 7–10: 80 Hán tự N5 — nhớ âm On/Kun và cách viết theo bộ thủ.",
      "Tuần 11–12: luyện số đếm, ngày tháng, giờ và ôn tổng hợp bằng quiz.",
    ],
  },
  {
    id: "kana-memory-tips",
    tag: "Mẹo học",
    date: "2026-10-18",
    title: "3 cách ghi nhớ Hiragana nhanh hơn",
    excerpt:
      "Gắn hình ảnh với nét chữ, học theo hàng a-i-u-e-o, và tự kiểm tra bằng cách ẩn romaji trên bảng chữ.",
    body: [
      "1. Học theo hàng nguyên âm (あ い う え お) thay vì cột — não nhớ chuỗi ngắn tốt hơn.",
      "2. Mỗi chữ gắn một hình ảnh: あ giống khuôn mặt, ぬ giống nút thắt…",
      "3. Dùng tính năng 'Ẩn romaji' rồi bấm từng ô để tự kiểm tra trước khi xem đáp án.",
    ],
  },
  {
    id: "counters-daily-life",
    tag: "Ngữ pháp",
    date: "2026-10-15",
    title: "Lượng từ hay gặp: つ, 人, 本, 枚",
    excerpt:
      "Đếm đồ vật dùng つ, người dùng 人, vật dài như bút/chai dùng 本, vật mỏng như giấy/áo dùng 枚.",
    body: [
      "Người: ひとり, ふたり, さんにん… (ngoại lệ cần học thuộc).",
      "Đồ vật: ひとつ, ふたつ, みっつ…",
      "本 (ほん): いっぽん, ろっぽん, はっぽん… — âm đục hóa theo quy tắc.",
      "枚 (まい): いちまい, にまい… — ít ngoại lệ, dễ dùng.",
    ],
  },
  {
    id: "why-katakana-matters",
    tag: "Kiến thức",
    date: "2026-10-12",
    title: "Vì sao Katakana quan trọng với người Việt?",
    excerpt:
      "Rất nhiều từ mượn tiếng Anh viết bằng Katakana: コーヒー, カメラ, テレビ… Nắm Kata = hiểu ngay 30% môi trường Nhật.",
    body: [
      "Katakana dùng cho từ nước ngoài, tên riêng, và nhấn mạnh.",
      "Học song song với Hiragana giúp phân biệt nhanh khi đọc thực tế.",
      "Trong app: bật cả Hiragana + Katakana để luyện chuyển đổi qua lại.",
    ],
  },
  {
    id: "daily-15-min",
    tag: "Thói quen",
    date: "2026-10-08",
    title: "15 phút mỗi ngày hiệu quả hơn 2 tiếng cuối tuần",
    excerpt:
      "Ôn cách quãng (spaced repetition) giúp nhớ lâu. Mỗi ngày một ít: 5 phút nghe, 5 phút quiz, 5 phút từ mới.",
    body: [
      "Sáng: ôn nhanh 10 chữ cái bằng flashcard.",
      "Trưa: làm 1 vòng quiz trắc nghiệm.",
      "Tối: học 5 từ mới và đọc lại bảng chữ.",
      "Cuối tuần: tổng ôn cả tuần, đánh dấu chữ chưa thuộc.",
    ],
  },
];

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });

export default function News() {
  return (
    <div style={JP}>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:max-w-4xl">
          <h1 className="hero-in hero-in-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Tin tức</h1>
          <p className="hero-in hero-in-2 mt-1.5 text-sm leading-snug text-stone-600">
            Mẹo học, lộ trình JLPT và kiến thức tiếng Nhật cho người mới.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6 lg:max-w-4xl">
        {ARTICLES.map((a, i) => (
          <article
            key={a.id}
            className={`fade-up delay-${Math.min(i + 1, 4)} ${
              i === 0
                ? "rounded-2xl border-2 border-red-200 bg-white p-5 shadow-sm transition duration-200 hover:shadow-md sm:p-6"
                : "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md sm:p-6"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  i === 0
                    ? "rounded-full bg-red-700 px-2.5 py-0.5 text-[11px] font-semibold text-white"
                    : "rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600"
                }
              >
                {a.tag}
              </span>
              {i === 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  Mới nhất
                </span>
              )}
              <time dateTime={a.date} className="text-xs text-stone-400">
                {fmtDate(a.date)}
              </time>
            </div>
            <h2 className="mt-2.5 text-lg font-bold leading-snug tracking-tight text-stone-900 sm:text-xl">
              {a.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{a.excerpt}</p>
            <details className="group mt-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-red-700 transition duration-150 hover:text-red-800">
                <span className="group-open:hidden">Đọc tiếp →</span>
                <span className="hidden group-open:inline">Thu gọn ↑</span>
              </summary>
              <ul className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                {a.body.map((line, j) => (
                  <li key={j} className="text-sm leading-relaxed text-stone-700">
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}

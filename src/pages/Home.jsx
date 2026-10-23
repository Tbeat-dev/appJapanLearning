const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

const FEATURES = [
  { icon: "あ", title: "Bảng chữ cái", desc: "Hiragana & Katakana — nghe, nhận diện, gõ romaji", tab: "kana" },
  { icon: "漢", title: "Hán tự", desc: "Chữ Hán, âm On/Kun, mẹo ghi nhớ, flashcard", tab: "kanji" },
  { icon: "数", title: "Số đếm", desc: "Cách đọc số, ngày tháng, giờ, lượng từ", tab: "num" },
  { icon: "語", title: "Từ vựng N5", desc: "Từ vựng cơ bản theo loại từ và chủ đề", tab: "vocab" },
];

const STEPS = [
  { n: "01", title: "Chọn bài học", desc: "Chữ cái, Hán tự, số đếm hoặc từ vựng N5." },
  { n: "02", title: "Học & luyện", desc: "Bảng chữ, flashcard, trắc nghiệm và gõ romaji." },
  { n: "03", title: "Nhớ lâu", desc: "Ôn tập chủ động — nghe phát âm, kiểm tra nhanh." },
];

function ScrollBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none bg-gradient-to-b from-stone-50 to-stone-100"
    />
  );
}

export default function Home({ onLearn, onNews }) {
  return (
    <div style={JP} className="relative">
      <ScrollBackground />

      <div className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="animate-float pointer-events-none absolute -right-10 -top-10 select-none text-[10rem] leading-none text-red-50 sm:-right-6 sm:text-[12rem]"
            style={JP}
          >
            あ
          </div>
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:max-w-4xl">
            <span className="hero-in hero-in-1 inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50/90 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm backdrop-blur">
              <span aria-hidden="true">🇯🇵</span> Học tiếng Nhật N5
            </span>
            <h1 className="hero-in hero-in-2 mt-4 text-3xl font-bold leading-tight tracking-tight text-stone-900 drop-shadow-sm sm:text-4xl">
              Học tiếng Nhật
              <br />
              <span className="text-red-700">từng bước một</span>
            </h1>
            <p className="hero-in hero-in-3 mt-3 max-w-lg text-base leading-relaxed text-stone-700 sm:text-lg">
              Bảng chữ cái, Hán tự, số đếm và từ vựng N5 — học mọi lúc trên điện thoại, kèm phát âm và luyện tập.
            </p>
            <div className="hero-in hero-in-4 mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onLearn}
                className="rounded-xl bg-red-700 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition duration-150 hover:bg-red-800 hover:shadow-md active:scale-[0.98]"
              >
                Học ngay →
              </button>
              <button
                type="button"
                onClick={onNews}
                className="rounded-xl border border-stone-300/70 bg-white/85 px-5 py-3.5 text-base font-medium text-stone-700 shadow-sm backdrop-blur transition duration-150 hover:bg-white active:bg-stone-100"
              >
                Tin tức
              </button>
            </div>
            <p className="hero-in hero-in-5 mt-4 text-xs text-stone-500">Miễn phí · Không cần đăng nhập · Chạy offline được</p>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:max-w-4xl">
          <h2 className="fade-up text-lg font-bold tracking-tight text-stone-900 drop-shadow-sm sm:text-xl">Nội dung học</h2>
          <p className="fade-up delay-1 mt-1 text-sm text-stone-600">Bốn phần học thiết kế cho người mới bắt đầu.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <button
                key={f.tab}
                type="button"
                onClick={() => onLearn(f.tab)}
                className={`fade-up delay-${Math.min(i + 1, 4)} group rounded-2xl border border-stone-200/70 bg-white/85 p-4 text-left shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-white/95 hover:shadow-md active:scale-[0.99] sm:p-5`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl font-medium text-red-700 transition duration-200 group-hover:scale-110 group-hover:bg-red-700 group-hover:text-white"
                  style={JP}
                >
                  {f.icon}
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-stone-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-snug text-stone-600">{f.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="border-t border-stone-200/60">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:max-w-4xl">
            <h2 className="fade-up text-lg font-bold tracking-tight text-stone-900 drop-shadow-sm sm:text-xl">Học thế nào?</h2>
            <div className="rounded-2xl border border-stone-200/70 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-6">
              <ol className="space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s.n} className={`fade-up delay-${Math.min(i + 1, 4)} flex gap-4`}>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white transition duration-200 hover:bg-red-700"
                    >
                      {s.n}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-stone-900">{s.title}</h3>
                      <p className="mt-0.5 text-sm leading-snug text-stone-600">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={onLearn}
                className="fade-up delay-4 mt-8 w-full rounded-xl bg-red-700 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition duration-150 hover:bg-red-800 hover:shadow-md active:scale-[0.99] sm:w-auto sm:px-8"
              >
                Bắt đầu học ngay →
              </button>
            </div>
          </div>
        </section>

        {/* Không gian để ảnh nền hiện rõ ở cuối trang */}
        <div aria-hidden="true" className="h-24 sm:h-32" />
      </div>
    </div>
  );
}

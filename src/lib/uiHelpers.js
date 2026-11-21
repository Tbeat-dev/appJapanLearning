// Pure UI/domain helper logic — decoupled for fast deterministic testing.

export const PROVERBS = [
  {
    jp: "継続は力なり",
    romaji: "Keizoku wa chikara nari",
    vi: "Kiên trì chính là sức mạnh. Mỗi ngày từng chút một sẽ tạo nên kỳ tích.",
  },
  {
    jp: "千里の道も一歩から",
    romaji: "Senri no michi mo ippo kara",
    vi: "Hành trình ngàn dặm cũng bắt đầu từ một bước chân đầu tiên.",
  },
  {
    jp: "七転び八起き",
    romaji: "Nanakorobi yaoki",
    vi: "Bảy lần vấp ngã, tám lần đứng dậy — đừng ngại sai khi luyện tập.",
  },
  {
    jp: "習うより慣れよ",
    romaji: "Narau yori nareyo",
    vi: "Thực hành lặp lại sẽ giúp bạn quen tự nhiên nhanh hơn chỉ đọc lý thuyết.",
  },
  {
    jp: "一期一会",
    romaji: "Ichigo ichie",
    vi: "Trân trọng từng khoảnh khắc gặp gỡ và từng phút giây tĩnh tâm học hôm nay.",
  },
];

/** Pick a deterministic proverb for the given Date. */
export function getDailyProverb(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.max(0, Math.floor(diff / 86400000));
  return PROVERBS[dayOfYear % PROVERBS.length];
}

/** Vietnamese greeting based on hour of day. */
export function getGreeting(hour = new Date().getHours()) {
  if (hour >= 4 && hour < 11) return "Chào buổi sáng";
  if (hour >= 11 && hour < 14) return "Chào buổi trưa";
  if (hour >= 14 && hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export const ROADMAP_CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "kana", label: "Chữ cái" },
  { id: "kanji", label: "Hán tự" },
  { id: "num", label: "Số đếm" },
  { id: "vocab", label: "Từ vựng" },
  { id: "grammar", label: "Ngữ pháp" },
];

/** Filter lessons by category and compute per-category counts. */
export function filterLessonsByCategory(lessons, category = "all") {
  if (!Array.isArray(lessons)) return [];
  if (!category || category === "all") return lessons;
  return lessons.filter((l) => l.kind === category);
}

export function countLessonsByCategory(lessons) {
  const counts = { all: lessons.length, kana: 0, kanji: 0, num: 0, vocab: 0, grammar: 0 };
  for (const l of lessons) {
    if (counts[l.kind] !== undefined) counts[l.kind] += 1;
  }
  return counts;
}

/** Format remaining seconds as MM:SS for exam timer. */
export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/** Grade a full exam answer map { [idx]: optionIdx } against questions array. */
export function gradeExam(questions, answers) {
  const results = questions.map((q, idx) => answers[idx] === q.answer);
  const score = results.filter(Boolean).length;
  const bySection = {};
  questions.forEach((q, idx) => {
    const sec = q.section;
    if (!bySection[sec]) bySection[sec] = { ok: 0, total: 0 };
    bySection[sec].total += 1;
    if (results[idx]) bySection[sec].ok += 1;
  });
  const answeredCount = questions.reduce(
    (acc, _, idx) => (answers[idx] !== undefined && answers[idx] !== null ? acc + 1 : acc),
    0
  );
  return {
    score,
    total: questions.length,
    answeredCount,
    results,
    bySection,
  };
}

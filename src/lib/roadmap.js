// Lộ trình N5 — UI_DESIGN_RULES mục 10 "Lộ trình".

import grammarList from "../data/grammar.json";

export const LESSONS = [
  {
    id: "hira",
    level: "N5",
    title: "Hiragana cơ bản",
    mins: 15,
    kind: "kana",
    group: "basic",
    script: "hira",
    summary: "46 âm cơ bản: a i u e o … n",
  },
  {
    id: "kata",
    level: "N5",
    title: "Katakana",
    mins: 15,
    kind: "kana",
    group: "basic",
    script: "kata",
    after: "hira",
    summary: "Chữ cho từ ngoại ngữ: カタカナ, コーヒー…",
  },
  {
    id: "dakuten",
    level: "N5",
    title: "Âm đục & âm ghép",
    mins: 12,
    kind: "kana",
    group: "dakuten",
    script: "hira",
    after: "kata",
    summary: "が ざ だ ば ぱ và きゃ しゃ ちゃ…",
  },
  {
    id: "yoon",
    level: "N5",
    title: "Âm ghép (yōon)",
    mins: 10,
    kind: "kana",
    group: "yoon",
    script: "hira",
    after: "dakuten",
    summary: "きゃ kya, しゃ sha, ちゃ cha…",
  },
  {
    id: "num",
    level: "N5",
    title: "Số đếm 1–10",
    mins: 10,
    kind: "num",
    subset: "basic",
    after: "yoon",
    summary: "いち に さん… và đếm đồ vật",
  },
  {
    id: "days",
    level: "N5",
    title: "Ngày trong tháng",
    mins: 10,
    kind: "num",
    subset: "days",
    after: "num",
    summary: "ついたち, ふつか, みっか… cách đọc đặc biệt",
  },
  {
    id: "kanji1",
    level: "N5",
    title: "Hán tự: 一〜十",
    mins: 15,
    kind: "kanji",
    range: [0, 10],
    after: "days",
    summary: "Mười chữ số Hán tự đầu tiên",
  },
  {
    id: "kanji2",
    level: "N5",
    title: "Hán tự cơ bản (ngày, người, lớn…)",
    mins: 20,
    kind: "kanji",
    range: [10, 40],
    after: "kanji1",
    summary: "30 chữ hay gặp trong N5",
  },
  {
    id: "vocab1",
    level: "N5",
    title: "Từ vựng: con người & trường học",
    mins: 15,
    kind: "vocab",
    cat: ["Danh từ"],
    range: [0, 40],
    after: "kanji1",
    summary: "40 từ đầu trong thư viện N5",
  },
  {
    id: "vocab2",
    level: "N5",
    title: "Từ vựng: sinh hoạt hằng ngày",
    mins: 15,
    kind: "vocab",
    range: [40, 100],
    after: "vocab1",
    summary: "Ăn uống, nhà cửa, thời gian",
  },
  {
    id: "grammar1",
    level: "N5",
    title: "Ngữ pháp: Trợ từ",
    mins: 15,
    kind: "grammar",
    cats: ["Trợ từ"],
    after: "vocab2",
    summary: "〜は 〜が 〜に 〜で — ai làm gì, ở đâu, khi nào",
  },
  {
    id: "grammar2",
    level: "N5",
    title: "Ngữ pháp: Cấu trúc câu",
    mins: 12,
    kind: "grammar",
    cats: ["Cấu trúc câu"],
    after: "grammar1",
    summary: "〜です/ます, thể trần, 〜んです, 〜ましょう",
  },
  {
    id: "grammar3",
    level: "N5",
    title: "Ngữ pháp: Động từ & tính từ",
    mins: 20,
    kind: "grammar",
    cats: ["Động từ", "Tính từ"],
    after: "grammar2",
    summary: "Dạng て, 〜ない, 〜たい, 〜ている, 〜ながら",
  },
  {
    id: "grammar4",
    level: "N5",
    title: "Ngữ pháp: Nối câu & so sánh",
    mins: 12,
    kind: "grammar",
    cats: ["Nối câu", "So sánh"],
    after: "grammar3",
    summary: "〜から, 〜けど, 〜より, いちばん, 〜だけ",
  },
];

/** Các mục ngữ pháp thuộc bài học (lọc theo cats). */
export function grammarItemsFor(lesson) {
  return grammarList.filter((g) => (lesson.cats || []).includes(g.cat));
}

export const lessonById = (id) => LESSONS.find((l) => l.id === id);

export function lessonDone(p, id) {
  return !!(p.lessons && p.lessons[id] && p.lessons[id].done);
}

export function lessonProgressRatio(p, lesson) {
  if (!lesson) return 0;
  if (lesson.kind === "kana") {
    const g = lesson.group;
    const n = g === "basic" ? 46 : g === "dakuten" ? 25 : 30;
    const ok = (p.stats && p.stats.kana && p.stats.kana.ok) || 0;
    // tiến độ thô theo số câu đúng chữ cái — dùng để mở mềm bài sau
    return Math.min(1, ok / Math.max(1, n));
  }
  if (lesson.kind === "num") {
    const ok = (p.stats && p.stats.num && p.stats.num.ok) || 0;
    return Math.min(1, ok / 15);
  }
  if (lesson.kind === "kanji") {
    const [a, b] = lesson.range || [0, 0];
    const total = Math.max(1, b - a);
    let hit = 0;
    const known = (p.known && p.known.kanji) || {};
    for (let i = a; i < b; i++) if (known[i]) hit++;
    return hit / total;
  }
  if (lesson.kind === "vocab") {
    const [a, b] = lesson.range || [0, 0];
    const total = Math.max(1, b - a);
    let hit = 0;
    const known = (p.known && p.known.vocab) || {};
    for (let i = a; i < b; i++) if (known[i]) hit++;
    return hit / total;
  }
  if (lesson.kind === "grammar") {
    const items = grammarItemsFor(lesson);
    if (!items.length) return 0;
    const known = (p.known && p.known.grammar) || {};
    const hit = items.reduce((n, g) => n + (known[g.id] ? 1 : 0), 0);
    return hit / items.length;
  }
  return 0;
}

/** Bài mở mềm: không khóa cứng, chỉ gợi ý học sau khi xong bài trước (≥40%). */
export function softLocked(p, lesson) {
  if (!lesson.after) return false;
  const prev = lessonById(lesson.after);
  if (!prev) return false;
  if (lessonDone(p, prev.id)) return false;
  return lessonProgressRatio(p, prev) < 0.4;
}

export function nextLesson(p) {
  return LESSONS.find((l) => !lessonDone(p, l.id)) || LESSONS[0];
}

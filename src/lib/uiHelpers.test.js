import test from "node:test";
import assert from "node:assert/strict";
import {
  getDailyProverb,
  getGreeting,
  filterLessonsByCategory,
  countLessonsByCategory,
  formatCountdown,
  gradeExam,
} from "./uiHelpers.js";

test("getGreeting returns Vietnamese time-of-day greetings", () => {
  assert.equal(getGreeting(7), "Chào buổi sáng");
  assert.equal(getGreeting(12), "Chào buổi trưa");
  assert.equal(getGreeting(15), "Chào buổi chiều");
  assert.equal(getGreeting(21), "Chào buổi tối");
});

test("getDailyProverb deterministically selects a proverb", () => {
  const d1 = new Date(2026, 0, 1);
  const d2 = new Date(2026, 0, 1);
  assert.deepEqual(getDailyProverb(d1), getDailyProverb(d2));
  assert.ok(getDailyProverb(d1).jp.length > 0);
});

test("filterLessonsByCategory & countLessonsByCategory work accurately", () => {
  const sample = [
    { id: "1", kind: "kana" },
    { id: "2", kind: "kana" },
    { id: "3", kind: "kanji" },
    { id: "4", kind: "grammar" },
  ];
  assert.equal(filterLessonsByCategory(sample, "all").length, 4);
  assert.equal(filterLessonsByCategory(sample, "kana").length, 2);
  assert.equal(filterLessonsByCategory(sample, "vocab").length, 0);
  assert.deepEqual(countLessonsByCategory(sample), {
    all: 4,
    kana: 2,
    kanji: 1,
    num: 0,
    vocab: 0,
    grammar: 1,
  });
});

test("formatCountdown formats MM:SS cleanly and clamps negative values", () => {
  assert.equal(formatCountdown(1500), "25:00");
  assert.equal(formatCountdown(65), "01:05");
  assert.equal(formatCountdown(-10), "00:00");
});

test("gradeExam computes score, answeredCount, and per-section accuracy", () => {
  const qs = [
    { section: "kana", answer: 1 },
    { section: "kana", answer: 0 },
    { section: "kanji", answer: 2 },
  ];
  const graded = gradeExam(qs, { 0: 1, 2: 0 });
  assert.equal(graded.score, 1);
  assert.equal(graded.total, 3);
  assert.equal(graded.answeredCount, 2);
  assert.deepEqual(graded.results, [true, false, false]);
  assert.deepEqual(graded.bySection, {
    kana: { ok: 1, total: 2 },
    kanji: { ok: 0, total: 1 },
  });
});

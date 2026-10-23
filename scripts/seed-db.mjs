// Seed data/kanalearn.db from data/source.mjs
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GROUPS, RAW, D, KD, PRE, HV, COUNTERS, DAYS, MIN, VRAW, TOPICS } from "../data/source.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dbDir = join(root, "data");
mkdirSync(dbDir, { recursive: true });
const dbPath = join(dbDir, "kanalearn.db");
rmSync(dbPath, { force: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE kana_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cols INTEGER NOT NULL,
  hiragana TEXT NOT NULL,
  romaji TEXT NOT NULL
);

CREATE TABLE kanji (
  id INTEGER PRIMARY KEY,
  kanji TEXT NOT NULL,
  hanviet TEXT NOT NULL,
  meaning TEXT NOT NULL,
  memo TEXT,
  on_reading TEXT,
  kun_reading TEXT,
  is_radical INTEGER NOT NULL DEFAULT 0 CHECK (is_radical IN (0, 1))
);

CREATE TABLE digits (
  digit INTEGER PRIMARY KEY,
  kana TEXT NOT NULL,
  kanji TEXT NOT NULL
);

CREATE TABLE number_exceptions (
  kind TEXT NOT NULL CHECK (kind IN ('pre', 'hv_pair', 'day', 'minute')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  value2 TEXT,
  PRIMARY KEY (kind, key)
);

CREATE TABLE counters (
  id INTEGER PRIMARY KEY,
  counter TEXT NOT NULL,
  reading TEXT,
  rule TEXT,
  note TEXT NOT NULL,
  special_readings TEXT -- JSON array, nullable
);

CREATE TABLE vocab (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  kanji TEXT,
  kana TEXT NOT NULL,
  meaning TEXT NOT NULL
);

CREATE TABLE topics (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  keywords TEXT NOT NULL -- space-separated keys, same as source
);

CREATE INDEX idx_kanji_radical ON kanji (is_radical);
CREATE INDEX idx_vocab_category ON vocab (category);
`);

db.prepare("INSERT INTO schema_meta (key, value) VALUES ('version', '1'), ('source', 'data/source.mjs')").run();

const insGroup = db.prepare("INSERT INTO kana_groups (id, name, cols, hiragana, romaji) VALUES (?, ?, ?, ?, ?)");
for (const g of GROUPS) insGroup.run(g.id, g.name, g.cols, g.k, g.r);

const insKanji = db.prepare(
  "INSERT INTO kanji (id, kanji, hanviet, meaning, memo, on_reading, kun_reading, is_radical) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);
RAW.forEach(([k, h, m, mem, on, kun, rad], id) => {
  insKanji.run(id, k, h, m, mem || null, on || null, kun || null, rad ? 1 : 0);
});

const insDigit = db.prepare("INSERT INTO digits (digit, kana, kanji) VALUES (?, ?, ?)");
for (let i = 1; i <= 9; i++) insDigit.run(i, D[i], KD[i]);

const insEx = db.prepare("INSERT INTO number_exceptions (kind, key, value, value2) VALUES (?, ?, ?, ?)");
for (const [k, v] of Object.entries(PRE)) insEx.run("pre", String(k), v, null);
for (const [k, [a, b]] of Object.entries(HV)) insEx.run("hv_pair", k, a, b);
for (const [k, v] of Object.entries(DAYS)) insEx.run("day", String(k), v, null);
for (const [k, v] of Object.entries(MIN)) insEx.run("minute", String(k), v, null);

const insCounter = db.prepare(
  "INSERT INTO counters (id, counter, reading, rule, note, special_readings) VALUES (?, ?, ?, ?, ?, ?)"
);
COUNTERS.forEach((c, id) => {
  insCounter.run(id, c.n, c.r || null, c.rule || null, c.note, c.sp ? JSON.stringify(c.sp) : null);
});

const insVocab = db.prepare("INSERT INTO vocab (id, category, kanji, kana, meaning) VALUES (?, ?, ?, ?, ?)");
let vid = 0;
for (const [cat, block] of Object.entries(VRAW)) {
  for (const line of block.split("\n")) {
    const [kanji, kana, vi] = line.split("|");
    insVocab.run(vid++, cat, kanji || null, kana, vi);
  }
}

const insTopic = db.prepare("INSERT INTO topics (id, name, keywords) VALUES (?, ?, ?)");
Object.entries(TOPICS).forEach(([name, keywords], id) => insTopic.run(id, name, keywords));

const counts = {};
for (const t of ["kana_groups", "kanji", "digits", "number_exceptions", "counters", "vocab", "topics"]) {
  counts[t] = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n;
}
db.close();
console.log("Seeded", dbPath, counts);

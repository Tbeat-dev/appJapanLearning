// Export data/kanalearn.db → src/data/*.json (what the React app imports)
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = new DatabaseSync(join(root, "data", "kanalearn.db"), { readOnly: true });
const outDir = join(root, "src", "data");
mkdirSync(outDir, { recursive: true });

const groups = db.prepare("SELECT id, name, cols, hiragana, romaji FROM kana_groups ORDER BY rowid").all();
const kanji = db
  .prepare('SELECT id, kanji AS "k", hanviet AS "h", meaning AS "m", memo AS "mem", on_reading AS "on", kun_reading AS "kun", is_radical AS "rad" FROM kanji ORDER BY id')
  .all()
  .map(({ rad, ...w }) => ({ ...w, rad: !!rad }));
const digits = db.prepare("SELECT digit, kana, kanji FROM digits ORDER BY digit").all();
const exceptions = db.prepare("SELECT kind, key, value, value2 FROM number_exceptions").all();
const counters = db
  .prepare("SELECT id, counter AS n, reading AS r, rule, note, special_readings FROM counters ORDER BY id")
  .all()
  .map(({ special_readings, ...c }) => ({
    ...c,
    r: c.r ?? undefined,
    rule: c.rule ?? undefined,
    ...(special_readings ? { sp: JSON.parse(special_readings) } : {}),
  }));
const vocab = db.prepare("SELECT id, category AS cat, kanji, kana, meaning AS vi FROM vocab ORDER BY id").all().map((w) => ({ ...w, kanji: w.kanji || "" }));
const topics = db.prepare("SELECT name, keywords FROM topics ORDER BY id").all();

db.close();

const ex = (kind) => Object.fromEntries(exceptions.filter((e) => e.kind === kind).map((e) => [e.key, e.value2 != null ? [e.value, e.value2] : e.value]));
const num = {
  D: ["", ...digits.map((d) => d.kana)],
  KD: ["", ...digits.map((d) => d.kanji)],
  PRE: ex("pre"),
  HV: ex("hv_pair"),
  DAYS: ex("day"),
  MIN: ex("minute"),
};

const files = {
  "kana.json": groups.map(({ hiragana, romaji, ...g }) => ({ ...g, k: hiragana, r: romaji })),
  "kanji.json": kanji,
  "counters.json": counters,
  "numbers.json": num,
  "vocab.json": vocab,
  "topics.json": topics.map(({ name, keywords }) => ({ name, keywords })),
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(outDir, name), JSON.stringify(data), "utf8");
  console.log(`src/data/${name}:`, Array.isArray(data) ? `${data.length} rows` : Object.keys(data).length + " keys");
}

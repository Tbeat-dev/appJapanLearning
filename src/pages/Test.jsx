import { useMemo, useState } from "react";
import { Trophy, AlertTriangle } from "lucide-react";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import { Segmented, LevelBadge } from "../components/common/Chip.jsx";
import { EmptyState } from "../components/common/Feedback.jsx";
import Quiz, { shuffle, makeOptions } from "../components/Quiz.jsx";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import numbers from "../data/numbers.json";
import { record } from "../lib/progress.js";

const N = 20;

function kanaPool() {
  const out = [];
  kanaGroups.forEach((g) => {
    const ks = g.k.split(" ");
    const rs = g.r.split(" ");
    ks.forEach((c, i) => {
      if (c === "_") return;
      out.push({ jp: c, romaji: rs[i] });
    });
  });
  return out;
}

function buildTest() {
  const kanas = shuffle(kanaPool()).slice(0, 5);
  const kanjis = shuffle(kanjiList.filter((k) => k.id < 500)).slice(0, 5);
  const vocabs = shuffle(vocabList).slice(0, 5);
  const dayEntries = Object.entries(numbers.DAYS);
  const nums = shuffle(
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
      jp: numbers.KD[n],
      reading: numbers.D[n],
      vi: String(n),
    }))
  ).slice(0, 3);
  const days = shuffle(
    dayEntries.map(([n, reading]) => ({ jp: `${n}日`, reading, vi: `ngày ${n}` }))
  ).slice(0, 2);

  const qs = [];

  kanas.forEach((k) => {
    const pool = kanaPool().map((x) => x.romaji);
    const { options, answer } = makeOptions(k.romaji, pool);
    qs.push({
      section: "kana",
      sectionLabel: "Chữ cái",
      prompt: "Ký tự này đọc là gì?",
      sub: k.jp,
      options,
      answer,
      explain: `${k.jp} đọc là “${k.romaji}”.`,
      key: k.jp,
    });
  });

  kanjis.forEach((w) => {
    const pool = kanjiList.filter((x) => x.id < 500).map((x) => x.m);
    const { options, answer } = makeOptions(w.m, pool);
    qs.push({
      section: "kanji",
      sectionLabel: "Hán tự",
      prompt: "Chữ này có nghĩa là gì?",
      sub: w.k,
      options,
      answer,
      explain: `${w.k} (${w.h}) — ${w.m}.`,
      key: String(w.id),
    });
  });

  vocabs.forEach((w) => {
    const main = w.kanji || w.kana.split("/")[0].trim();
    const pool = vocabList.map((x) => x.vi);
    const { options, answer } = makeOptions(w.vi, pool);
    qs.push({
      section: "vocab",
      sectionLabel: "Từ vựng",
      prompt: "Từ này có nghĩa là gì?",
      sub: main,
      options,
      answer,
      explain: `${main} (${w.kana}) — ${w.vi}.`,
      key: String(w.id),
    });
  });

  [...nums, ...days].forEach((it) => {
    const pool = [...nums, ...days].map((x) => x.reading);
    const { options, answer } = makeOptions(it.reading, pool);
    qs.push({
      section: "num",
      sectionLabel: "Số đếm",
      prompt: "Đọc tiếng Nhật của từ này là gì?",
      sub: it.jp,
      options,
      answer,
      explain: `${it.jp} — ${it.reading}.`,
      key: it.jp,
    });
  });

  return shuffle(qs).slice(0, N);
}

/**
 * Luyện đề — bài kiểm tra theo cấp. Điểm luôn gắn nhãn "chỉ tham khảo".
 */
export default function Test() {
  const [mode, setMode] = useState("idle");
  const [result, setResult] = useState(null);
  const [seed, setSeed] = useState(0);
  const testKey = useMemo(() => buildTest(), [seed]);

  const start = () => {
    setResult(null);
    setSeed((s) => s + 1);
    setMode("running");
  };

  const onDone = ({ score, total, results }) => {
    const bySection = {};
    testKey.forEach((q, i) => {
      const s = q.section;
      if (!bySection[s]) bySection[s] = { ok: 0, total: 0 };
      bySection[s].total += 1;
      if (results[i]) bySection[s].ok += 1;
    });
    setResult({ score, total, bySection });
    setMode("done");
  };

  if (mode === "running") {
    return (
      <div>
        <h1 className="sr-only">Đang làm bài luyện đề N5</h1>
        <Quiz
          questions={testKey}
          title="Luyện đề N5 · 20 câu"
          onExit={() => setMode("idle")}
          onAnswer={(q, correct) => record(q.section, q.key, correct)}
          onDone={onDone}
        />
      </div>
    );
  }

  if (mode === "done" && result) {
    const weak = Object.entries(result.bySection)
      .map(([sec, v]) => ({ sec, ...v, acc: v.total ? v.ok / v.total : 0 }))
      .filter((x) => x.acc < 0.7)
      .sort((a, b) => a.acc - b.acc);
    const labels = { kana: "Chữ cái", kanji: "Hán tự", vocab: "Từ vựng", num: "Số đếm" };

    return (
      <div className="stagger mx-auto w-full max-w-xl space-y-5">
        <header className="flex items-center gap-3">
          <Trophy aria-hidden="true" className="h-8 w-8 text-[var(--warning)]" />
          <div>
            <h1 className="text-[var(--fs-h1)] font-bold">Kết quả bài luyện</h1>
            <p className="text-sm text-[var(--text-muted)]">Điểm nội bộ, chỉ tham khảo — không phải chứng chỉ JLPT.</p>
          </div>
        </header>

        <Card>
          <p className="text-[var(--fs-display)] font-bold text-[var(--brand)]">
            {result.score}/{result.total}
          </p>
          <ProgressBar value={result.score} max={result.total} label="Số câu đúng" className="mt-3" />
          <div className="mt-4 space-y-2">
            {Object.entries(result.bySection).map(([sec, v]) => (
              <div key={sec} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{labels[sec] || sec}</span>
                <span className="font-semibold">
                  {v.ok}/{v.total}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {weak.length > 0 ? (
          <Card>
            <div className="flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="h-5 w-5 text-[var(--warning)]" />
              <h2 className="text-[var(--fs-h3)] font-semibold">Cần ôn thêm</h2>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-muted)]">
              {weak.map((w) => (
                <li key={w.sec}>
                  • {labels[w.sec] || w.sec}: đúng {w.ok}/{w.total} — mở Thư viện hoặc Ôn tập để củng cố.
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-[var(--text-muted)]">
              Bạn làm tốt phần kiến thức trong bài này. Tiếp tục lộ trình để mở rộng thêm.
            </p>
          </Card>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={start} className="flex-1">
            Làm lại đề mới
          </Button>
          <Button variant="secondary" onClick={() => (window.location.hash = "#/library")} className="flex-1">
            Mở Thư viện
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="stagger space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[var(--fs-h1)] font-bold">Luyện đề</h1>
          <LevelBadge level="N5" />
        </div>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          20 câu trắc nghiệm: chữ cái, hán tự, từ vựng, số đếm. Mỗi lần làm là một đề mới.
        </p>
      </header>

      <Segmented
        ariaLabel="Chọn loại luyện"
        value={mode}
        onChange={(v) => {
          if (v === "start") start();
        }}
        options={[
          { value: "idle", label: "Đề N5 · 20 câu" },
          { value: "start", label: "Bắt đầu" },
        ]}
      />

      <EmptyState
        title="Sẵn sàng làm đề?"
        hint="Điểm số chỉ dùng để theo dõi tiến độ nội bộ. Không có câu khẳng định bạn đã đạt JLPT."
        actionLabel="Bắt đầu làm 20 câu"
        onAction={start}
        icon={Trophy}
      />
    </div>
  );
}

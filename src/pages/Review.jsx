import { useMemo, useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import { EmptyState } from "../components/common/Feedback.jsx";
import ListenButton from "../components/common/ListenButton.jsx";
import { Segmented } from "../components/common/Chip.jsx";
import WritingPad from "../components/WritingPad.jsx";
import { useProfile, markRemembered, record, flushPending, getP } from "../lib/progress.js";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import numbers from "../data/numbers.json";

const toKata = (s) =>
  [...s]
    .map((c) => {
      const n = c.charCodeAt(0);
      return n >= 0x3041 && n <= 0x3096 ? String.fromCharCode(n + 0x60) : c;
    })
    .join("");

const KANA_MAP = {};
kanaGroups.forEach((g) => {
  const ks = g.k.split(" ");
  const rs = g.r.split(" ");
  ks.forEach((c, i) => {
    if (c === "_") return;
    KANA_MAP[`hira-${g.id}-${i}`] = { jp: c, sub: rs[i], sec: "kana" };
    KANA_MAP[`kata-${g.id}-${i}`] = { jp: toKata(c), sub: rs[i], sec: "kana" };
  });
});

const KANJI_MAP = Object.fromEntries(kanjiList.map((w) => [String(w.id), w]));
const VOCAB_MAP = Object.fromEntries(vocabList.map((w) => [String(w.id), w]));

function resolveWk(wk) {
  const i = wk.indexOf(":");
  const sec = wk.slice(0, i);
  const id = wk.slice(i + 1);
  if (sec === "kana") {
    const c = KANA_MAP[id];
    return c ? { wk, sec, jp: c.jp, sub: c.sub, front: c.jp, back: `Đọc: ${c.sub}` } : null;
  }
  if (sec === "kanji") {
    const w = KANJI_MAP[id];
    return w ? { wk, sec, jp: w.k, sub: w.h, front: w.k, back: `${w.h} — ${w.m}` } : null;
  }
  if (sec === "vocab") {
    const w = VOCAB_MAP[id];
    if (!w) return null;
    const main = w.kanji || w.kana.split(/\s*[\/,、]\s*/)[0].trim();
    return { wk, sec, jp: main, sub: w.kanji ? w.kana : "", front: main, back: w.vi };
  }
  if (sec === "num") {
    return { wk, sec, jp: id, sub: "", front: id, back: "Số đếm" };
  }
  return null;
}

const SEC_LABEL = { kana: "Chữ cái", kanji: "Hán tự", vocab: "Từ vựng", num: "Số đếm" };

/**
 * Ôn tập — thẻ ghi nhớ từ danh sách từ hay sai. Lật thẻ, Chưa nhớ / Đã nhớ.
 * Chế độ Viết: ôn kana/hán tự bằng WritingPad (chữ hay sai).
 */
export default function Review({ go }) {
  const p = useProfile();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [mode, setMode] = useState("cards");

  const deck = useMemo(
    () => Object.keys(p.wrong || {}).map(resolveWk).filter(Boolean),
    [p.wrong]
  );
  const writeDeck = useMemo(() => deck.filter((c) => c.sec === "kana" || c.sec === "kanji"), [deck]);
  const activeDeck = mode === "write" ? writeDeck : deck;

  useEffect(() => {
    setI(0);
    setFlipped(false);
  }, [deck.length, mode]);

  const deckEmpty = deck.length === 0;
  const empty = activeDeck.length === 0;
  const card = empty ? null : activeDeck[Math.min(i, activeDeck.length - 1)];
  const finished = !empty && i >= activeDeck.length;

  const answer = (remembered) => {
    if (!card) return;
    flushPending();
    if (remembered) markRemembered(card.wk);
    else {
      const id = card.wk.includes(":") ? card.wk.split(":").slice(1).join(":") : card.wk;
      record(card.sec, id, false);
    }
    setFlipped(false);
    setDoneCount((d) => d + 1);
    setI((x) => x + 1);
  };

  useEffect(() => {
    if (empty || finished || !card) return undefined;
    const onKey = (e) => {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (mode === "cards") {
        if (e.key === " " || (e.key === "Enter" && e.target.tagName !== "BUTTON")) {
          e.preventDefault();
          setFlipped((f) => !f);
          return;
        }
        if (!flipped) return;
      }
      if (e.key === "ArrowLeft") answer(false);
      if (e.key === "ArrowRight") answer(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (deckEmpty) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-[var(--fs-h1)] font-bold">Ôn tập</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Thẻ yếu được gộp từ kana, hán tự, từ vựng và số đếm.
          </p>
        </header>
        <EmptyState
          title="Chưa có thẻ cần ôn"
          hint="Khi bạn trả lời sai ở bài luyện, thẻ sẽ xuất hiện ở đây để ôn lại đúng lúc sắp quên."
          actionLabel="Học bài trên lộ trình"
          onAction={() => go("#/roadmap")}
        />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-md space-y-5 text-center">
        <h1 className="text-[var(--fs-h1)] font-bold">Xong phiên ôn tập</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Đã xử lý {doneCount}/{activeDeck.length} thẻ. Thẻ nhớ sẽ biến mất khỏi danh sách; thẻ chưa nhớ quay lại sau.
        </p>
        <Button onClick={() => go("#/")} className="w-full">
          Về Hôm nay
        </Button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-[var(--fs-h1)] font-bold">Ôn tập</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Thẻ yếu được gộp từ kana, hán tự, từ vựng và số đếm.
          </p>
        </header>
        <Segmented
          ariaLabel="Chế độ ôn tập"
          value={mode}
          onChange={setMode}
          options={[
            { value: "cards", label: "Thẻ" },
            { value: "write", label: "Viết" },
          ]}
        />
        <EmptyState
          title="Không có chữ nào để viết"
          hint="Chế độ viết áp dụng cho thẻ kana và hán tự hay sai. Thẻ từ vựng, số đếm vẫn ôn bằng thẻ ghi nhớ."
          actionLabel="Chuyển sang ôn thẻ"
          onAction={() => setMode("cards")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[var(--fs-h1)] font-bold">Ôn tập</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Thẻ {i + 1}/{deck.length} · {SEC_LABEL[card.sec] || card.sec}
          </p>
        </div>
        <ListenButton text={card.jp} label={`Nghe ${card.jp}`} />
      </header>

      <Segmented
        ariaLabel="Chế độ ôn tập"
        value={mode}
        onChange={setMode}
        options={[
          { value: "cards", label: "Thẻ" },
          { value: "write", label: "Viết" },
        ]}
      />

      {mode === "cards" ? (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Xem mặt trước" : "Lật thẻ xem đáp án"}
          className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-6 py-10 shadow-[var(--shadow-1)] transition duration-200 hover:border-[var(--brand)]"
          style={{ animation: "fade-up 0.18s ease-out both" }}
        >
          <span lang="ja" className="ja-display text-center text-[var(--fs-display)] font-bold text-[var(--text)]">
            {card.front}
          </span>
          {card.sub && <span className="romaji">{card.sub}</span>}
          {flipped ? (
            <span className="mt-2 rounded-[var(--radius-full)] bg-[var(--brand-soft)] px-3 py-1 text-sm font-semibold text-[var(--brand)]">
              {card.back}
            </span>
          ) : (
            <span className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <Eye aria-hidden="true" className="h-4 w-4" /> Bấm để lật
            </span>
          )}
        </button>
      ) : (
        <WritingPad
          key={card.wk}
          glyph={card.jp}
          reading={card.sec === "kana" ? card.sub : ""}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => answer(false)}
          disabled={mode === "cards" && !flipped}
          className="min-h-14 flex-col !gap-0.5"
        >
          <EyeOff aria-hidden="true" className="h-5 w-5" />
          Chưa nhớ
        </Button>
        <Button
          onClick={() => answer(true)}
          disabled={mode === "cards" && !flipped}
          className="min-h-14 flex-col !gap-0.5"
        >
          <Eye aria-hidden="true" className="h-5 w-5" />
          Đã nhớ
        </Button>
      </div>
      {mode === "cards" && !flipped && (
        <p className="text-center text-xs text-[var(--text-muted)]">Lật thẻ trước khi chọn</p>
      )}
      {mode === "write" && (
        <p className="text-center text-xs text-[var(--text-muted)]">
          Viết xong rồi chọn Đã nhớ / Chưa nhớ.
        </p>
      )}
      <p className="text-center text-[var(--fs-tiny)] text-[var(--text-faint)]">
        {mode === "cards"
          ? "Phím tắt máy tính: ← Chưa nhớ · → Đã nhớ (sau khi lật)"
          : "Phím tắt máy tính: ← Chưa nhớ · → Đã nhớ"}
      </p>
    </div>
  );
}

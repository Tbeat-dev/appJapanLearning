import { useMemo, useState, useEffect } from "react";
import {
  RotateCcw,
  CheckCheck,
  Volume2,
  MousePointerClick,
  Lightbulb,
  BookOpenCheck,
  RefreshCw,
  Award,
} from "lucide-react";
import Button from "../components/common/Button.jsx";
import Card from "../components/common/Card.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import { EmptyState } from "../components/common/Feedback.jsx";
import ListenButton from "../components/common/ListenButton.jsx";
import { Segmented } from "../components/common/Chip.jsx";
import WritingPad from "../components/WritingPad.jsx";
import { useProfile, markRemembered, record, flushPending } from "../lib/progress.js";
import { speak, ttsAvailable } from "../lib/tts.js";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import grammarList from "../data/grammar.json";

const cx = (...a) => a.filter(Boolean).join(" ");

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
const GRAMMAR_MAP = Object.fromEntries(grammarList.map((g) => [String(g.id), g]));

function resolveWk(wk) {
  const i = wk.indexOf(":");
  const sec = wk.slice(0, i);
  const id = wk.slice(i + 1);
  if (sec === "kana") {
    const c = KANA_MAP[id];
    return c ? { wk, sec, jp: c.jp, sub: c.sub, front: c.jp, back: `Cách đọc: ${c.sub}` } : null;
  }
  if (sec === "kanji") {
    const w = KANJI_MAP[id];
    return w
      ? {
          wk,
          sec,
          jp: w.k,
          sub: w.h,
          front: w.k,
          back: `${w.h} — ${w.m}`,
          note: w.mem || [w.on && `ON: ${w.on}`, w.kun && `KUN: ${w.kun}`].filter(Boolean).join(" · "),
        }
      : null;
  }
  if (sec === "vocab") {
    const w = VOCAB_MAP[id];
    if (!w) return null;
    const main = w.kanji || w.kana.split(/\s*[\/,、]\s*/)[0].trim();
    return {
      wk,
      sec,
      jp: main,
      sub: w.kanji ? w.kana : "",
      front: main,
      back: w.vi,
      tag: w.cat,
    };
  }
  if (sec === "num") {
    return { wk, sec, jp: id, sub: "", front: id, back: "Số đếm tiếng Nhật" };
  }
  if (sec === "grammar") {
    const g = GRAMMAR_MAP[id];
    if (!g) return null;
    return {
      wk,
      sec,
      jp: g.pat,
      sub: g.name,
      front: g.pat,
      back: g.mean,
      ex: g.ex,
      exvi: g.vi,
      note: g.note,
    };
  }
  return null;
}

const SEC_LABEL = {
  kana: "Chữ cái",
  kanji: "Hán tự",
  vocab: "Từ vựng",
  num: "Số đếm",
  grammar: "Ngữ pháp",
};

/**
 * Ôn tập thông minh (SRS) — Flashcard lật 2 mặt + Chế độ viết + Thống kê phiên.
 * Desktop (≥1024px): 12 cột (7 cột thẻ tương tác, 5 cột thống kê & khoa học SRS).
 */
export default function Review({ go }) {
  const p = useProfile();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [mode, setMode] = useState("cards");

  const deck = useMemo(
    () => Object.keys(p.wrong || {}).map(resolveWk).filter(Boolean),
    [p.wrong]
  );
  const writeDeck = useMemo(
    () => deck.filter((c) => c.sec === "kana" || c.sec === "kanji"),
    [deck]
  );
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
    if (remembered) {
      markRemembered(card.wk);
      setRememberedCount((r) => r + 1);
    } else {
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
      <div className="space-y-6">
        <header>
          <p className="eyebrow text-[var(--brand-deep)]">Ôn tập ngắt quãng (SRS)</p>
          <h1 className="font-display mt-1 text-[var(--fs-h1)] font-semibold text-[var(--text)]">
            Ôn tập thông minh
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Thẻ yếu được gộp tự động từ kana, hán tự, từ vựng, số đếm và ngữ pháp khi bạn làm bài.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <EmptyState
              title="Chưa có thẻ cần ôn"
              hint="Khi bạn trả lời sai ở bài luyện hoặc luyện đề, thẻ sẽ tự động xuất hiện ở đây để ôn đúng lúc sắp quên."
              actionLabel="Học bài trên lộ trình"
              onAction={() => go("#/roadmap")}
            />
          </div>
          <Card className="flex items-start gap-3.5 bg-[var(--surface-low)] lg:col-span-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-high)] text-[var(--text-muted)]">
              <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--text)]">Khoa học Spaced Repetition (SRS)</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                Thẻ ôn đúng thời điểm rơi vào “điểm quên” sinh học sẽ chuyển dần kiến thức từ trí nhớ ngắn hạn sang trí nhớ dài hạn với nỗ lực tối thiểu.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-1)] sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--success-soft)] text-[var(--success)]">
          <Award aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="eyebrow text-[var(--brand-deep)]">Ôn tập hoàn tất</p>
        <h1 className="font-display text-[var(--fs-h1)] font-semibold text-[var(--text)]">
          Xong phiên ôn tập
        </h1>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          Đã xử lý <span className="tabular font-bold text-[var(--text)]">{doneCount}</span> thẻ
          {rememberedCount > 0 ? ` (${rememberedCount} thẻ đã thuộc tốt)` : ""}. Thẻ nhớ sẽ tự động rời khỏi hàng đợi; thẻ chưa nhớ quay lại sau.
        </p>
        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
          <Button onClick={() => go("#/")} className="flex-1">
            Về Hôm nay
          </Button>
          <Button variant="secondary" onClick={() => go("#/roadmap")} className="flex-1">
            Mở lộ trình
          </Button>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="space-y-5">
        <header>
          <p className="eyebrow text-[var(--brand-deep)]">Ôn tập ngắt quãng (SRS)</p>
          <h1 className="font-display mt-1 text-[var(--fs-h1)] font-semibold text-[var(--text)]">
            Ôn tập thông minh
          </h1>
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
          hint="Chế độ viết áp dụng cho thẻ kana và hán tự hay sai. Thẻ từ vựng, số đếm và ngữ pháp ôn bằng thẻ ghi nhớ."
          actionLabel="Chuyển sang ôn thẻ"
          onAction={() => setMode("cards")}
        />
      </div>
    );
  }

  const currentIdx = Math.min(i + 1, activeDeck.length);
  const remaining = Math.max(0, activeDeck.length - i);

  return (
    <div className="space-y-5">
      {/* Header & Thanh tiến độ */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow text-[var(--brand-deep)]">Ôn tập ngắt quãng (SRS)</p>
            <h1 className="font-display mt-1 text-[var(--fs-h1)] font-semibold text-[var(--text)]">
              Ôn tập thông minh
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular text-sm font-medium text-[var(--text-muted)]">
              Thẻ <strong className="text-[var(--brand-deep)]">{currentIdx}</strong> / {activeDeck.length}
            </span>
            <ListenButton text={card.jp} label={`Nghe ${card.jp}`} />
          </div>
        </div>

        <ProgressBar value={currentIdx} max={activeDeck.length} label="Tiến độ phiên ôn" />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Segmented
            ariaLabel="Chế độ ôn tập"
            value={mode}
            onChange={setMode}
            options={[
              { value: "cards", label: "Thẻ ghi nhớ" },
              { value: "write", label: "Luyện viết" },
            ]}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {SEC_LABEL[card.sec] || card.sec}
            {card.tag ? ` · ${card.tag}` : ""}
            {" · JLPT N5"}
          </span>
        </div>
      </header>

      {/* Workspace 12 cột trên desktop */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* Cột trái: Thẻ lật hoặc Khung viết + 2 nút đánh giá */}
        <div className="space-y-4 lg:col-span-7">
          {mode === "cards" ? (
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? "Xem mặt trước thẻ" : "Lật thẻ xem đáp án"}
              className="flex min-h-[340px] w-full flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)] transition duration-200 hover:border-[var(--brand)]/50 hover:shadow-[var(--shadow-2)] sm:min-h-[380px] sm:p-6"
            >
              {!flipped ? (
                <>
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-low)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
                      {SEC_LABEL[card.sec] || card.sec} · JLPT N5
                    </span>
                    {ttsAvailable() && p.settings?.sound !== false && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Phát âm ${card.jp}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(card.jp);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            speak(card.jp);
                          }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-deep)] transition hover:bg-[var(--brand-fixed)]"
                      >
                        <Volume2 aria-hidden="true" className="h-5 w-5" />
                      </span>
                    )}
                  </div>

                  <div className="my-auto flex w-full flex-col items-center justify-center py-6 text-center">
                    <span
                      lang="ja"
                      className={cx(
                        "ja-display text-center font-semibold text-[var(--text)]",
                        card.front.length <= 4
                          ? "text-5xl sm:text-6xl"
                          : card.front.length <= 12
                            ? "text-3xl sm:text-4xl"
                            : "text-2xl sm:text-3xl"
                      )}
                    >
                      {card.front}
                    </span>
                    {card.sub && (
                      <span className="mt-2.5 text-sm font-medium tracking-wide text-[var(--text-muted)]">
                        {card.sub}
                      </span>
                    )}
                  </div>

                  <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--surface-low)] px-3 py-2.5 text-xs font-medium text-[var(--text-muted)]">
                    <MousePointerClick aria-hidden="true" className="h-4 w-4 text-[var(--brand)]" />
                    <span>Chạm vào thẻ để lật xem nghĩa &amp; gợi ý</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                      <div className="min-w-0">
                        <span lang="ja" className="font-display text-xl font-bold text-[var(--brand-deep)]">
                          {card.front}
                        </span>
                        {card.sub && (
                          <span className="ml-2 text-xs text-[var(--text-muted)]">「{card.sub}」</span>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--success)]">
                        Đáp án
                      </span>
                    </div>

                    <div>
                      <p className="eyebrow text-[var(--outline)]">Ý nghĩa chính</p>
                      <p className="mt-1 text-lg font-bold text-[var(--text)] sm:text-xl">
                        {card.back}
                      </p>
                    </div>

                    {card.ex && (
                      <div className="rounded-xl bg-[var(--surface-low)] p-3.5">
                        <p lang="ja" className="text-sm font-medium text-[var(--text)]">
                          {card.ex}
                        </p>
                        {card.exvi && (
                          <p className="mt-1 text-xs italic text-[var(--text-muted)]">“{card.exvi}”</p>
                        )}
                      </div>
                    )}

                    {card.note && (
                      <div className="flex items-start gap-2 rounded-xl bg-[var(--surface-2)]/70 p-3 text-xs text-[var(--text-muted)]">
                        <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--outline)]" />
                        <span>{card.note}</span>
                      </div>
                    )}
                  </div>

                  <p className="pt-3 text-center text-[11px] text-[var(--outline)]">
                    Chạm lại vào thẻ để quay về mặt chữ
                  </p>
                </>
              )}
            </button>
          ) : (
            <WritingPad
              key={card.wk}
              glyph={card.jp}
              reading={card.sec === "kana" ? card.sub : ""}
            />
          )}

          {/* Hai nút đánh giá SRS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => answer(false)}
              disabled={mode === "cards" && !flipped}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-[var(--surface-high)] px-3 py-2 text-[var(--text)] shadow-[var(--shadow-1)] transition hover:bg-[var(--surface-highest)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-1.5 text-[15px] font-bold">
                <RotateCcw aria-hidden="true" className="h-4 w-4 text-[var(--danger)]" />
                <span>Chưa nhớ</span>
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Lặp lại sau</span>
            </button>

            <button
              type="button"
              onClick={() => answer(true)}
              disabled={mode === "cards" && !flipped}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl bg-[var(--brand)] px-3 py-2 text-[var(--on-brand)] shadow-[var(--shadow-1)] transition hover:bg-[var(--brand-hover)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
            >
              <span className="flex items-center gap-1.5 text-[15px] font-bold">
                <CheckCheck aria-hidden="true" className="h-4 w-4" />
                <span>Đã nhớ tốt</span>
              </span>
              <span className="text-[11px] opacity-90">Giảm lỗi &amp; tiến tiếp</span>
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-faint)]">
            {mode === "cards" && !flipped
              ? "Lật thẻ trước khi đánh giá · Phím Space/Enter để lật"
              : "Phím tắt: ← Chưa nhớ · → Đã nhớ tốt"}
          </p>
        </div>

        {/* Cột phải: Thống kê phiên + Khoa học SRS */}
        <aside className="space-y-4 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <Card className="flex items-center gap-3 bg-[var(--surface-low)] !p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
                <CheckCheck aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="tabular text-lg font-bold leading-tight text-[var(--text)]">
                  {rememberedCount} thẻ
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">Đã thuộc phiên này</p>
              </div>
            </Card>

            <Card className="flex items-center gap-3 bg-[var(--surface-low)] !p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-deep)]">
                <RefreshCw aria-hidden="true" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="tabular text-lg font-bold leading-tight text-[var(--text)]">
                  {remaining} thẻ
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">Cần củng cố</p>
              </div>
            </Card>
          </div>

          <Card className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
              <BookOpenCheck aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-[var(--text)]">
                Khoa học Spaced Repetition (SRS)
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
                Thẻ ôn đúng thời điểm rơi vào “điểm quên” sinh học sẽ chuyển dần kiến thức từ trí nhớ ngắn hạn sang trí nhớ vĩnh viễn với nỗ lực tối thiểu.
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

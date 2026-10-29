import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ArrowLeft, X } from "lucide-react";
import Card from "../components/common/Card.jsx";
import { Chip, LevelBadge, Segmented } from "../components/common/Chip.jsx";
import { EmptyState, Skeleton } from "../components/common/Feedback.jsx";
import ListenButton from "../components/common/ListenButton.jsx";
import ProgressBar from "../components/common/ProgressBar.jsx";
import Button from "../components/common/Button.jsx";
import WritingPad from "../components/WritingPad.jsx";
import kanaGroups from "../data/kana.json";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";
import numbers from "../data/counters.json";
import { useProfile, toggleKnown } from "../lib/progress.js";

const toKata = (s) =>
  [...s]
    .map((c) => {
      const n = c.charCodeAt(0);
      return n >= 0x3041 && n <= 0x3096 ? String.fromCharCode(n + 0x60) : c;
    })
    .join("");

const PAGE = 40;

/* ---------- Hộp thoại luyện viết ---------- */
function WriteModal({ item, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!item) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Luyện viết ${item.jp}`}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]"
        style={{ animation: "pop-in 0.2s ease-out both" }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[var(--fs-h3)] font-bold text-[var(--text)]">
            Luyện viết{" "}
            <span lang="ja" className="ja-display">
              {item.jp}
            </span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <WritingPad key={item.jp} glyph={item.jp} reading={item.reading || ""} />
      </div>
    </div>
  );
}

/* ---------- Bảng chữ cái ---------- */
function KanaBoard() {
  const p = useProfile();
  const [script, setScript] = useState("hira");
  const [hideRomaji, setHideRomaji] = useState(false);
  const [writing, setWriting] = useState(null);

  return (
    <div className="space-y-4">
      <Segmented
        ariaLabel="Chọn bảng chữ"
        value={script}
        onChange={setScript}
        options={[
          { value: "hira", label: "Hiragana" },
          { value: "kata", label: "Katakana" },
        ]}
      />
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={hideRomaji}
          onChange={(e) => setHideRomaji(e.target.checked)}
          className="h-5 w-5 rounded-[var(--radius-sm)] border-[var(--border)]"
        />
        Ẩn romaji (tự kiểm tra)
      </label>
      <p className="text-xs text-[var(--text-muted)]">Chạm chữ để luyện viết.</p>

      {kanaGroups.map((g) => {
        const ks = g.k.split(" ");
        const rs = g.r.split(" ");
        const cells = ks.map((c, i) => {
          if (c === "_") return null;
          const jp = script === "kata" ? toKata(c) : c;
          return { key: `${script}-${g.id}-${i}`, jp, romaji: rs[i] };
        }).filter(Boolean);
        return (
          <section key={g.id} aria-label={g.name}>
            <h3 className="mb-2 text-[var(--fs-h3)] font-semibold">{g.name}</h3>
            <div
              className="stagger grid gap-2"
              style={{ gridTemplateColumns: `repeat(${g.cols || 5}, minmax(0, 1fr))` }}
            >
              {cells.map((c) => {
                const best = (p.write || {})[c.jp] || 0;
                return (
                  <div
                    key={c.key}
                    className="flex flex-col items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-3"
                  >
                    <button
                      type="button"
                      onClick={() => setWriting({ jp: c.jp, reading: c.romaji })}
                      aria-label={`Luyện viết ${c.jp}`}
                      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] transition duration-150 hover:bg-[var(--brand-soft)] active:scale-95"
                    >
                      <span lang="ja" className="ja-display text-2xl font-bold">
                        {c.jp}
                      </span>
                      {best >= 60 && (
                        <span
                          aria-hidden="true"
                          className="absolute -right-1 -top-1 text-[10px] text-[var(--success)]"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                    {!hideRomaji && <span className="romaji mt-0.5">{c.romaji}</span>}
                    <ListenButton text={c.jp} size="sm" className="mt-1.5" label={`Nghe ${c.jp}`} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      <WriteModal item={writing} onClose={() => setWriting(null)} />
    </div>
  );
}

/* ---------- Hán tự ---------- */
function KanjiList() {
  const p = useProfile();
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [writing, setWriting] = useState(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    // id 0–399 ~ N5, 400–999 ~ N4, còn lại N3+ (gợi ý phân loại thô)
    return kanjiList.filter((w) => {
      if (level === "N5" && w.id >= 400) return false;
      if (level === "N4" && (w.id < 400 || w.id >= 1000)) return false;
      if (level === "N3" && w.id < 1000) return false;
      if (!needle) return true;
      return (
        w.k.includes(q.trim()) ||
        (w.m || "").toLowerCase().includes(needle) ||
        (w.h || "").toLowerCase().includes(needle)
      );
    });
  }, [level, q]);

  const shown = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-faint)]"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Tìm theo chữ, Hán Việt, nghĩa…"
          aria-label="Tìm hán tự"
          className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] pl-11 pr-3 text-[var(--fs-body)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {["all", "N5", "N4", "N3"].map((lv) => (
          <Chip key={lv} selected={level === lv} onClick={() => { setLevel(lv); setLimit(PAGE); }}>
            {lv === "all" ? "Tất cả" : lv}
          </Chip>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        {filtered.length.toLocaleString("vi-VN")} chữ · đang hiển thị {shown.length}
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy chữ" hint="Thử từ khóa khác hoặc đổi bộ lọc cấp độ." />
      ) : (
        <ul className="stagger space-y-2">
          {shown.map((w) => {
            const known = !!p.known.kanji?.[w.id];
            return (
              <li key={w.id}>
                <Card className="!flex !items-start !gap-3">
                  <button
                    type="button"
                    onClick={() => toggleKnown("kanji", w.id)}
                    aria-pressed={known}
                    aria-label={known ? `Bỏ đánh dấu ${w.k}` : `Đánh dấu đã biết ${w.k}`}
                    className={
                      known
                        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--success-soft)] text-[var(--success)]"
                        : "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-faint)]"
                    }
                  >
                    {known ? "✓" : "＋"}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span lang="ja" className="ja-display text-3xl font-bold">
                        {w.k}
                      </span>
                      <LevelBadge level={w.id < 400 ? "N5" : w.id < 1000 ? "N4" : "N3"} />
                      <span className="ml-auto flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setWriting({ jp: w.k, reading: "" })}
                        >
                          Viết
                        </Button>
                        <ListenButton text={w.k} size="sm" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">{w.h} — {w.m}</p>
                    {w.mem && <p className="mt-0.5 text-xs text-[var(--text-muted)]">Mẹo nhớ: {w.mem}</p>}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {w.on && (
                        <span className="rounded-[var(--radius-full)] bg-[var(--info-soft)] px-2 py-0.5 text-[var(--info)]">
                          <strong>ON</strong> {w.on}
                        </span>
                      )}
                      {w.kun && (
                        <span className="rounded-[var(--radius-full)] bg-[var(--warning-soft)] px-2 py-0.5 text-[var(--warning)]">
                          <strong>KUN</strong> {w.kun}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {shown.length < filtered.length && (
        <Button variant="secondary" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
          Xem thêm {Math.min(PAGE, filtered.length - shown.length)} chữ
        </Button>
      )}

      <WriteModal item={writing} onClose={() => setWriting(null)} />
    </div>
  );
}

/* ---------- Số đếm ---------- */
function CounterList() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        Ô cách đọc biến âm dùng nền vàng nhạt kèm ghi chú “Cách đọc đặc biệt”.
      </p>
      <ul className="stagger space-y-3">
        {numbers.map((c) => (
          <li key={c.id}>
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <span lang="ja" className="ja-display text-2xl font-bold">{c.n}</span>
                {c.r && <span className="romaji">({c.r})</span>}
                <ListenButton text={c.n} size="sm" className="ml-auto" />
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{c.note}</p>
              {c.rule && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Quy tắc: {c.rule === "k" ? "đọc âm ON" : c.rule === "g" ? "đọc âm KUN" : c.rule}
                </p>
              )}
              {c.sp && (
                <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {c.sp.map((s, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-1 py-2"
                    >
                      <span className="text-sm font-bold">{i + 1}</span>
                      <span lang="ja" className="text-xs" style={{ fontFamily: "var(--font-ja)" }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
              {c.d && (
                <ul className="mt-3 space-y-1 text-sm">
                  {Object.entries(c.d).map(([k, v]) => (
                    <li key={k} className="flex items-center gap-2">
                      <span className="w-8 text-right font-semibold">{k}</span>
                      <span lang="ja" style={{ fontFamily: "var(--font-ja)" }}>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <section aria-labelledby="special-days">
        <h3 id="special-days" className="mb-2 text-[var(--fs-h3)] font-semibold">
          Cách đọc đặc biệt (ngày trong tháng)
        </h3>
        <Card className="!bg-[var(--warning-soft)]">
          <p className="text-xs font-semibold text-[var(--warning)]">Cách đọc đặc biệt</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            {[
              ["1日", "ついたち"],
              ["2日", "ふつか"],
              ["3日", "みっか"],
              ["4日", "よっか"],
              ["5日", "いつか"],
              ["6日", "むいか"],
              ["7日", "なのか"],
              ["8日", "ようか"],
              ["9日", "ここのか"],
              ["10日", "とおか"],
              ["14日", "じゅうよっか"],
              ["20日", "はつか"],
              ["24日", "にじゅうよっか"],
            ].map(([d, r]) => (
              <li key={d}>
                <span lang="ja" style={{ fontFamily: "var(--font-ja)" }}>{d}</span> · {r}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

/* ---------- Từ vựng ---------- */
function VocabList() {
  const p = useProfile();
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [onlyUnknown, setOnlyUnknown] = useState(false);

  const cats = useMemo(() => [...new Set(vocabList.map((v) => v.cat).filter(Boolean))], []);
  const [cat, setCat] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return vocabList.filter((v) => {
      if (cat !== "all" && v.cat !== cat) return false;
      if (onlyUnknown && p.known.vocab?.[v.id]) return false;
      if (!needle) return true;
      return (
        (v.kanji || "").includes(q.trim()) ||
        (v.kana || "").toLowerCase().includes(needle) ||
        (v.vi || "").toLowerCase().includes(needle)
      );
    });
  }, [q, cat, onlyUnknown, p.known.vocab]);

  const shown = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-faint)]"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Tìm từ vựng…"
          aria-label="Tìm từ vựng"
          className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] pl-11 pr-3 text-[var(--fs-body)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Chip selected={cat === "all"} onClick={() => { setCat("all"); setLimit(PAGE); }}>
          Tất cả
        </Chip>
        {cats.map((c) => (
          <Chip key={c} selected={cat === c} onClick={() => { setCat(c); setLimit(PAGE); }}>
            {c}
          </Chip>
        ))}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--text-muted)]">
        <input
          type="checkbox"
          checked={onlyUnknown}
          onChange={(e) => {
            setOnlyUnknown(e.target.checked);
            setLimit(PAGE);
          }}
          className="h-5 w-5 rounded-[var(--radius-sm)] border-[var(--border)]"
        />
        Chỉ hiện từ chưa đánh dấu
      </label>

      <p className="text-xs text-[var(--text-muted)]">
        {filtered.length} từ · đang hiển thị {shown.length}
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="Không có từ phù hợp" hint="Bỏ bớt bộ lọc hoặc đổi từ khóa." />
      ) : (
        <ul className="stagger divide-y divide-[var(--border)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
          {shown.map((v) => {
            const known = !!p.known.vocab?.[v.id];
            return (
              <li key={v.id} className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleKnown("vocab", v.id)}
                  aria-pressed={known}
                  aria-label={known ? `Bỏ đánh dấu ${v.vi}` : `Đánh dấu đã biết ${v.vi}`}
                  className={
                    known
                      ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--success-soft)] text-[var(--success)]"
                      : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-faint)]"
                  }
                >
                  {known ? "✓" : "＋"}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[17px] font-semibold text-[var(--text)]">{v.vi}</span>
                    {v.cat && (
                      <span className="rounded-[var(--radius-full)] bg-[var(--surface-2)] px-2 py-0.5 text-[var(--fs-tiny)] text-[var(--text-muted)]">
                        {v.cat}
                      </span>
                    )}
                  </div>
                  <p lang="ja" className="mt-0.5 text-sm text-[var(--text-muted)]" style={{ fontFamily: "var(--font-ja)" }}>
                    {[v.kanji, v.kana].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ListenButton text={v.kanji || v.kana} size="sm" />
              </li>
            );
          })}
        </ul>
      )}

      {shown.length < filtered.length && (
        <Button variant="secondary" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
          Xem thêm từ
        </Button>
      )}
    </div>
  );
}

/* ---------- Trang Thư viện ---------- */
export default function Library({ sub, go }) {
  const tab = sub || "kana";
  const titles = {
    kana: "Bảng chữ cái",
    kanji: "Hán tự",
    num: "Số đếm",
    vocab: "Từ vựng",
  };

  if (!titles[tab]) {
    return (
      <EmptyState
        title="Không có mục này"
        hint="Chọn một mục trong thư viện."
        actionLabel="Về Thư viện"
        onAction={() => go("#/library")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => go("#/library")}
          aria-label="Quay lại thư viện"
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--brand)] lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Thư viện
          </p>
          <h1 className="mt-0.5 text-[var(--fs-h1)] font-bold">{titles[tab]}</h1>
        </div>
      </header>

      {tab === "kana" && <KanaBoard />}
      {tab === "kanji" && <KanjiList />}
      {tab === "num" && <CounterList />}
      {tab === "vocab" && <VocabList />}
    </div>
  );
}

/** Màn chọn mục thư viện (khi chưa có sub). */
export function LibraryIndex({ go }) {
  const items = [
    { id: "kana", title: "Bảng chữ cái", desc: "Hiragana · Katakana · âm đục · âm ghép", icon: "あ" },
    { id: "kanji", title: "Hán tự", desc: `${kanjiList.length.toLocaleString("vi-VN")} chữ · lọc N5/N4/N3`, icon: "漢" },
    { id: "num", title: "Số đếm", desc: "Số, người, đồ vật, ngày tháng", icon: "数" },
    { id: "vocab", title: "Từ vựng", desc: `${vocabList.length} từ N5 theo loại`, icon: "語" },
  ];
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Thư viện
        </p>
        <h1 className="mt-1 text-[var(--fs-h1)] font-bold">Nội dung N5</h1>
      </header>
          <ul className="stagger grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => go(`#/library/${it.id}`)}
              className="flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]"
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-soft)] text-xl font-bold text-[var(--brand)]"
              >
                {it.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[var(--fs-h3)] font-semibold">{it.title}</span>
                <span className="block text-sm text-[var(--text-muted)]">{it.desc}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

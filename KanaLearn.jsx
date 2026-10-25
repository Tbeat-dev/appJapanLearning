import { useState, useMemo, useRef, useEffect } from "react";
import { record, toggleKnown, useProfile, flushPending } from "./src/lib/progress.js";
import { AchievementToast } from "./src/components/Achievements.jsx";
import { FocusWrap, useFocusSession } from "./src/components/Focus.jsx";
import kanaGroups from "./src/data/kana.json";
import kanjiList from "./src/data/kanji.json";
import countersList from "./src/data/counters.json";
import numbersData from "./src/data/numbers.json";
import vocabList from "./src/data/vocab.json";
import topicsList from "./src/data/topics.json";

const GROUPS = kanaGroups;
const SCRIPTS = { hira: "Hiragana", kata: "Katakana" };
const ALIAS = {
  shi: ["si"], chi: ["ti"], tsu: ["tu"], fu: ["hu"], ji: ["zi", "di"], zu: ["du"], wo: ["o"],
  ja: ["jya", "zya"], ju: ["jyu", "zyu"], jo: ["jyo", "zyo"],
  sha: ["sya"], shu: ["syu"], sho: ["syo"], cha: ["tya"], chu: ["tyu"], cho: ["tyo"],
};

const toKata = (s) =>
  [...s].map((c) => { const n = c.charCodeAt(0); return n >= 0x3041 && n <= 0x3096 ? String.fromCharCode(n + 0x60) : c; }).join("");

const cellsOf = (g, s) => {
  const k = g.k.split(" "), r = g.r.split(" ");
  return k.map((c, i) => (c === "_" ? null : { id: `${s}-${g.id}-${i}`, k: s === "kata" ? toKata(c) : c, r: r[i], s, g: g.id }));
};

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = 0.8;
  const v = synth.getVoices().find((x) => x.lang.replace("_", "-").startsWith("ja"));
  if (v) u.voice = v;
  synth.speak(u);
}

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

const BTN = {
  primary:
    "w-full rounded-xl bg-red-700 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition duration-150 hover:bg-red-800 active:scale-[0.99]",
  ghost:
    "rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-medium text-stone-700 transition duration-150 hover:bg-stone-50 active:bg-stone-100",
  answer:
    "flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center font-medium transition duration-150 active:scale-[0.99]",
};

// Thanh điều khiển gọn: tiêu đề + một hàng điều khiển cuộn ngang (2 hàng tổng)
function Toolbar({ title, desc, count, children }) {
  return (
    <section className="mb-4 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2.5 px-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-stone-900 sm:text-lg">
            {title}
          </h1>
          {desc && <p className="truncate text-xs leading-snug text-stone-500">{desc}</p>}
        </div>
        {count != null && (
          <span className="shrink-0 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            {count}
          </span>
        )}
      </div>
      <div className="no-scrollbar -mx-1 mt-2.5 flex items-center gap-1.5 overflow-x-auto px-1">
        {children}
      </div>
    </section>
  );
}

// Vạch ngăn giữa các cụm điều khiển trong hàng cuộn
function Sep() {
  return <span aria-hidden="true" className="h-4 w-px shrink-0 bg-stone-200" />;
}

// Một cụm chip trong hàng cuộn: có thể kèm nhãn nhỏ phía trước
function Group({ label, children }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{label}</span>
      )}
      {children}
    </span>
  );
}

function ChipRow({ label, children, className }) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {label && (
        <span className="w-16 shrink-0 truncate text-[10px] font-bold uppercase tracking-wider text-stone-400">
          {label}
        </span>
      )}
      <div className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={!!active}
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition duration-150 active:scale-[0.98]",
        active
          ? "border-red-700 bg-red-700 text-white shadow-sm"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50"
      )}
    >
      {children}
    </button>
  );
}

function Segmented({ items, value, onChange, className, inline }) {
  if (inline) {
    // Dạng nằm trong hàng cuộn ngang (không chiếm thêm hàng riêng)
    return (
      <div
        className={cx("flex w-max shrink-0 items-center gap-1 rounded-xl bg-stone-200/70 p-1", className)}
        role="tablist"
      >
        {items.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={value === k}
            onClick={() => onChange(k)}
            className={cx(
              "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] leading-tight transition duration-150",
              value === k
                ? "bg-white font-semibold text-red-700 shadow-sm"
                : "font-medium text-stone-600 hover:text-stone-900"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div
      className={cx("grid gap-1 rounded-xl bg-stone-200/70 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}
      role="tablist"
    >
      {items.map(([k, l]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={cx(
            "min-h-8 rounded-lg px-1 py-1.5 text-center text-[13px] leading-tight transition duration-150 sm:text-sm",
            value === k
              ? "bg-white font-semibold text-red-700 shadow-sm"
              : "font-medium text-stone-600 hover:text-stone-900"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Panel({ children, className }) {
  return (
    <div className={cx("rounded-2xl border border-stone-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

function ProgressHeader({ ok, n, round = 10 }) {
  const idx = n === 0 ? 1 : ((n - 1) % round) + 1;
  const pct = n === 0 ? 0 : Math.round((idx / round) * 100);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-stone-600">
          Câu <b className="font-semibold text-stone-900">{idx}</b>
          <span className="text-stone-400">/{round}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          <span className="text-emerald-600">✓</span> Đúng {ok}/{n}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full rounded-full bg-red-700 transition-[width] duration-300"
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}

function Feedback({ ok, children, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, []);
  return (
    <div ref={ref}>
      <div
        role="status"
        className={cx(
          "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-medium leading-snug",
          ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white",
            ok ? "bg-emerald-600" : "bg-red-500"
          )}
        >
          {ok ? "✓" : "✕"}
        </span>
        <div className="min-w-0 break-words">{children}</div>
      </div>
      {footer}
    </div>
  );
}

function KanaSection() {
  const [scripts, setScripts] = useState(["hira"]);
  const [groups, setGroups] = useState(["basic"]);
  const [mode, setMode] = useState("chart");

  const toggle = (arr, set, v) => {
    const n = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    if (n.length) set(n);
  };

  const pool = useMemo(
    () => scripts.flatMap((s) => GROUPS.filter((g) => groups.includes(g.id)).flatMap((g) => cellsOf(g, s).filter(Boolean))),
    [scripts, groups]
  );
  const key = scripts.join() + groups.join();

  return (
    <div style={JP}>
    <Toolbar
      title="Học bảng chữ cái tiếng Nhật"
      desc="Hiragana & Katakana — nghe, nhận diện và gõ romaji"
      count={`${pool.length} chữ`}
      >

      <Segmented
        inline
        items={[
          ["chart", "Bảng chữ"],
          ["quiz", "Trắc nghiệm"],
          ["type", "Gõ romaji"],
        ]}
        value={mode}
        onChange={setMode}
      />
      <Sep />
      <Group>
        {Object.entries(SCRIPTS).map(([id, n]) => (
          <Chip key={id} active={scripts.includes(id)} onClick={() => toggle(scripts, setScripts, id)}>
            {n}
          </Chip>
        ))}
      </Group>
      <Sep />
      <Group>
        {GROUPS.map((g) => (
          <Chip key={g.id} active={groups.includes(g.id)} onClick={() => toggle(groups, setGroups, g.id)}>
            {g.name}
          </Chip>
        ))}
      </Group>
    </Toolbar>


      {mode === "chart" && <Chart scripts={scripts} groups={groups} />}
      {mode === "quiz" && <Quiz key={key} pool={pool} />}
      {mode === "type" && <TypeIn key={key} pool={pool} />}
    </div>
  );
}

function Chart({ scripts, groups }) {
  const [hideR, setHideR] = useState(false);
  const [shown, setShown] = useState({});
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => { setHideR(!hideR); setShown({}); }}
          aria-pressed={hideR}
          className={cx(BTN.ghost, hideR && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100")}
        >
          {hideR ? "Hiện romaji" : "Ẩn romaji (tự kiểm tra)"}
        </button>
        <span className="text-xs text-stone-500">Chạm ô chữ để nghe phát âm</span>
      </div>

      {scripts.map((s) =>
        GROUPS.filter((g) => groups.includes(g.id)).map((g) => {
          const cells = cellsOf(g, s);
          return (
            <section key={s + g.id}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-800">
                  {SCRIPTS[s]} · {g.name}
                </h2>
                <span className="text-xs text-stone-400">{cells.filter(Boolean).length} chữ</span>
              </div>
              <div
                className="grid gap-1.5 sm:gap-2"
                style={{
                  gridTemplateColumns:
                    g.cols === 3
                      ? "repeat(auto-fill, minmax(76px, 1fr))"
                      : `repeat(${g.cols}, minmax(0, 1fr))`,
                }}
              >
                {cells.map((c, i) =>
                  c ? (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={`${c.k} ${c.r}`}
                      onClick={() => { speak(c.k); setShown((x) => ({ ...x, [c.id]: true })); }}
                      className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-1 py-2 shadow-sm transition duration-150 hover:border-red-200 hover:bg-red-50/60 active:scale-[0.97] active:bg-red-50"
                    >
                      <span className="text-xl font-medium leading-none text-stone-900 sm:text-2xl" style={JP}>
                        {c.k}
                      </span>
                      <span
                        className={cx(
                          "h-3.5 text-[10px] font-medium leading-none sm:text-[11px]",
                          hideR && !shown[c.id] ? "text-stone-300" : "text-stone-500"
                        )}
                      >
                        {hideR && !shown[c.id] ? "?" : c.r}
                      </span>
                    </button>
                  ) : (
                    <div key={i} />
                  )
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function makeQ(pool, dir) {
  const d = dir === "mix" ? pick(["k2r", "r2k"]) : dir;
  const a = pick(pool);
  const others = shuffle(pool.filter((x) => x.r !== a.r && x.k !== a.k)).slice(0, 3);
  return { a, opts: shuffle([a, ...others]), dir: d };
}

function Quiz({ pool }) {
  const fs = useFocusSession({ secKey: "kana", kind: "quiz", label: "Trắc nghiệm chữ cái" });
  const [dir, setDir] = useState("k2r");
  const [q, setQ] = useState(() => makeQ(pool, "k2r"));
  const [sel, setSel] = useState(null);
  const [sc, setSc] = useState({ ok: 0, n: 0 });
  const k2r = q.dir === "k2r";
  const next = (d = dir) => { flushPending(); setQ(makeQ(pool, d)); setSel(null); };
  const choose = (o) => {
    if (sel) return;
    setSel(o);
    const right = o.id === q.a.id;
    setSc((s) => ({ ok: s.ok + (right ? 1 : 0), n: s.n + 1 }));
    record("kana", q.a.id, right);
    fs.answer(right, { jp: k2r ? q.a.k : q.a.r, sub: k2r ? q.a.r : q.a.k });
    speak(q.a.k);
  };
  if (pool.length < 4)
    return (
      <Panel className="p-4 text-sm text-stone-600">
        Cần ít nhất 4 chữ — hãy chọn thêm loại chữ hoặc nhóm âm.
      </Panel>
    );
  const ok = sel && sel.id === q.a.id;
  return (
    <FocusWrap fs={fs}>
      <ProgressHeader ok={sc.ok} n={sc.n} />

      <ChipRow className="mb-3">
        {[["k2r", "Chữ → Romaji"], ["r2k", "Romaji → Chữ"], ["mix", "Trộn cả hai"]].map(([d, l]) => (
          <Chip key={d} active={dir === d} onClick={() => { setDir(d); next(d); }}>
            {l}
          </Chip>
        ))}
      </ChipRow>

      <Panel className="mb-3 px-4 py-7 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {k2r ? "Chữ nào được đọc là…" : "Romaji nào là chữ này…"}
        </div>
        <div className="mt-2 break-words text-6xl font-bold leading-tight text-stone-900 sm:text-7xl" style={JP}>
          {k2r ? q.a.k : q.a.r}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {q.opts.map((o) => {
          const right = o.id === q.a.id;
          let cls = "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50";
          if (sel) {
            if (right) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
            else if (sel.id === o.id) cls = "border-red-400 bg-red-50 text-red-800";
            else cls = "border-stone-200 bg-white text-stone-900 opacity-55";
          }
          return (
            <button
              key={o.id}
              type="button"
              disabled={!!sel}
              aria-pressed={sel ? sel.id === o.id : undefined}
              onClick={() => choose(o)}
              className={cx(BTN.answer, cls)}
            >
              {right && sel && <span className="text-sm font-bold text-emerald-600">✓</span>}
              {sel && !right && sel.id === o.id && (
                <span className="text-sm font-bold text-red-500">✕</span>
              )}
              <span className={k2r ? "text-lg sm:text-xl" : "text-3xl sm:text-4xl"} style={k2r ? undefined : JP}>
                {k2r ? o.r : o.k}
              </span>
            </button>
          );
        })}
      </div>

      {sel && (
        <Feedback
          ok={ok}
          footer={
            <button type="button" onClick={() => next()} className={cx(BTN.primary, "mt-3")}>
              Câu tiếp theo →
            </button>
          }
        >
          {ok ? (
            <>Chính xác — <b>{k2r ? q.a.r : q.a.k}</b></>
          ) : (
            <>Chưa đúng — đáp án đúng: <b>{k2r ? q.a.r : q.a.k}</b></>
          )}
        </Feedback>
      )}
    </FocusWrap>
  );
}

function TypeIn({ pool }) {
  const fs = useFocusSession({ secKey: "kana", kind: "quiz", label: "Gõ romaji" });
  const [cur, setCur] = useState(() => pick(pool));
  const [val, setVal] = useState("");
  const [res, setRes] = useState(null);
  const [sc, setSc] = useState({ ok: 0, n: 0 });
  const inputRef = useRef(null);
  const submit = () => {
    if (res !== null) { flushPending(); setCur(pick(pool)); setVal(""); setRes(null); inputRef.current && inputRef.current.focus(); return; }
    const v = val.trim().toLowerCase();
    if (!v) return;
    const ok = [cur.r, ...(ALIAS[cur.r] || [])].includes(v);
    setRes(ok);
    setSc((s) => ({ ok: s.ok + (ok ? 1 : 0), n: s.n + 1 }));
    record("kana", cur.id, ok);
    fs.answer(ok, { jp: cur.k, sub: cur.r });
    speak(cur.k);
  };
  const focusInput = () => {
    const el = inputRef.current;
    if (el) { el.focus(); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  };
  return (
    <FocusWrap fs={fs}>
      <ProgressHeader ok={sc.ok} n={sc.n} />

      <Panel
        className={cx(
          "mb-3 border-2 px-4 py-6 text-center",
          res === null ? "border-stone-200" : res ? "border-emerald-400" : "border-red-400"
        )}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          Gõ romaji cho chữ này
        </div>
        <div className="mt-1 break-words text-6xl font-bold leading-tight text-stone-900 sm:text-7xl" style={JP}>
          {cur.k}
        </div>
      </Panel>

      <input
        ref={inputRef}
        autoFocus
        value={val}
        readOnly={res !== null}
        onChange={(e) => setVal(e.target.value)}
        onFocus={focusInput}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Gõ romaji rồi nhấn Enter…"
        aria-label="Nhập romaji"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-center text-lg text-stone-900 placeholder:text-sm placeholder:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
      />

      {res === null ? (
        <button type="button" onClick={submit} className={cx(BTN.primary, "mt-3")}>
          Kiểm tra
        </button>
      ) : (
        <Feedback
          ok={res}
          footer={
            <button type="button" onClick={submit} className={cx(BTN.primary, "mt-3")}>
              Chữ tiếp theo →
            </button>
          }
        >
          {res ? (
            <>Chính xác — <b>{cur.r}</b></>
          ) : (
            <>Chưa đúng — đáp án: <b>{cur.r}</b></>
          )}
        </Feedback>
      )}
      <p className="mt-2 text-center text-xs text-stone-500">
        Trên máy tính: nhấn Enter để kiểm tra nhanh
      </p>
    </FocusWrap>
  );
}

// ================= HÁN TỰ =================
// ---- Đọc âm Hán tự: romaji → hiragana rồi phát âm ----
const ROM = (() => {
  const m = { a: "あ", i: "い", u: "う", e: "え", o: "お", n: "ん" };
  const rows = { k: "かきくけこ", s: "さしすせそ", t: "たちつてと", n: "なにぬねの", h: "はひふへほ", m: "まみむめも", r: "らりるれろ", g: "がぎぐげご", z: "ざじずぜぞ", d: "だぢづでど", b: "ばびぶべぼ", p: "ぱぴぷぺぽ" };
  Object.entries(rows).forEach(([c, ks]) => [..."aiueo"].forEach((v, i) => (m[c + v] = ks[i])));
  Object.assign(m, { ya: "や", yu: "ゆ", yo: "よ", wa: "わ", wo: "を", shi: "し", chi: "ち", tsu: "つ", fu: "ふ", ji: "じ", sha: "しゃ", shu: "しゅ", sho: "しょ", cha: "ちゃ", chu: "ちゅ", cho: "ちょ", ja: "じゃ", ju: "じゅ", jo: "じょ" });
  const small = { a: "ゃ", u: "ゅ", o: "ょ" };
  Object.entries({ ky: "き", ny: "に", hy: "ひ", my: "み", ry: "り", gy: "ぎ", by: "び", py: "ぴ" }).forEach(([c, b]) => [..."auo"].forEach((v) => (m[c + v] = b + small[v])));
  return m;
})();
function romToKana(raw, isOn) {
  if (/[ぁ-んァ-ヴ]/.test(raw)) return raw.replace(/[.\s()]/g, "");
  let s = raw.replace(/[()\s.'\-]/g, "");
  if (isOn) s = s.replace(/OO/g, "OU").replace(/EE/g, "EI");
  s = s.toLowerCase();
  let out = "", i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === s[i + 1] && !"aiueon".includes(c)) { out += "っ"; i++; continue; }
    const t3 = ROM[s.slice(i, i + 3)], t2 = ROM[s.slice(i, i + 2)];
    if (t3 && s.length - i >= 3) { out += t3; i += 3; }
    else if (t2 && s.length - i >= 2) { out += t2; i += 2; }
    else { out += ROM[c] || ""; i++; }
  }
  return out;
}
const toks = (s) => (s ? s.split(/\s*[,;、]\s*/).filter(Boolean) : []);
const kanjiSay = (w) => {
  const kun = toks(w.kun).map((t) => romToKana(t, false)).filter(Boolean).sort((a, b) => b.length - a.length);
  if (kun.length) return kun[0];
  return toks(w.on).map((t) => romToKana(t, true)).filter(Boolean)[0] || "";
};
function KSpeak({ w, lg }) {
  const t = kanjiSay(w);
  if (!t) return null;
  return (
    <button type="button" title="Nghe phát âm" aria-label="Nghe phát âm"
      onClick={(e) => { e.stopPropagation(); speak(t); }}
      className={`flex items-center justify-center rounded-full border border-stone-300 bg-white transition duration-150 hover:border-red-200 hover:bg-red-50 active:scale-95 ${lg ? "w-12 h-12 text-2xl" : "w-9 h-9 text-base"}`}>🔊</button>
  );
}

const DATA = kanjiList;

const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
const short = (w) => `${w.h} · ${w.m.split(/[,;]/)[0].trim()}`;

function Readings({ w }) {
  const row = (str, isOn, cls, label) => {
    const items = toks(str);
    if (!items.length) return null;
    return (
      <div key={label} className="flex items-start gap-2">
        <span className="mt-1 w-8 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          {label}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {items.map((t, i) => {
            const kana = romToKana(t, isOn);
            return (
              <button
                key={label + i}
                type="button"
                title={`Nghe phát âm: ${kana}`}
                onClick={(e) => { e.stopPropagation(); speak(kana); }}
                className={cx(
                  "rounded-lg border px-2.5 py-2 text-[11px] font-medium leading-tight transition duration-150 active:scale-[0.97]",
                  cls
                )}
              >
                {t}
                <span className="mx-1 opacity-55">{kana}</span>
                <span aria-hidden="true">🔊</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  const on = row(w.on, true, "border-amber-200 bg-amber-50 text-amber-900", "On");
  const kun = row(w.kun, false, "border-sky-200 bg-sky-50 text-sky-900", "Kun");
  if (!on && !kun) return null;
  return (
    <div className="space-y-1.5">
      {on}
      {kun}
    </div>
  );
}

function KanjiSection() {
  const [scope, setScope] = useState("kanji");
  const [mode, setMode] = useState("list");
  const pool = useMemo(
    () => DATA.filter((w) => (scope === "all" ? true : scope === "rad" ? w.rad : !w.rad)),
    [scope]
  );
  return (
    <div style={JP}>
    <Toolbar
      title="Hán tự · Từ Hán Nhật"
      desc="Chữ Hán, âm Hán Việt, âm On/Kun và mẹo ghi nhớ"
      count={`${pool.length}/${DATA.length}`}
    >
      <Segmented
        inline
        items={[
          ["list", "Danh sách"],
          ["card", "Flashcard"],
          ["quiz", "Trắc nghiệm"],
        ]}
        value={mode}
        onChange={setMode}
      />
      <Sep />
      <Group>
        {[["kanji", "Hán tự"], ["rad", "Bộ thủ"], ["all", "Tất cả"]].map(([k, l]) => (
          <Chip key={k} active={scope === k} onClick={() => setScope(k)}>
            {l}
            <span className={cx("ml-1.5 text-xs", scope === k ? "text-red-100" : "text-stone-400")}>
              {k === "kanji" ? DATA.filter((w) => !w.rad).length : k === "rad" ? DATA.filter((w) => w.rad).length : DATA.length}
            </span>
          </Chip>
        ))}
      </Group>
    </Toolbar>


      {mode === "list" && <ListView key={scope} pool={pool} />}
      {mode === "card" && <CardView key={scope} pool={pool} />}
      {mode === "quiz" && <QuizView key={scope} pool={pool} />}
    </div>
  );
}

function ListView({ pool }) {
  const [q, setQ] = useState("");
  const [hide, setHide] = useState("none");
  const [open, setOpen] = useState({});
  const [limit, setLimit] = useState(60);
  const rows = useMemo(() => {
    const n = norm(q.trim());
    return n ? pool.filter((w) => norm(`${w.k} ${w.h} ${w.m} ${w.on} ${w.kun} ${w.mem}`).includes(n)) : pool;
  }, [pool, q]);
  const hidden = (w, part) => hide === part && !open[w.id];
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(60); }} placeholder="Tìm: chữ Hán, Hán Việt, nghĩa, âm đọc…"
          aria-label="Tìm kiếm Hán tự"
          className="min-w-[180px] flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100" />
        <select value={hide} onChange={(e) => { setHide(e.target.value); setOpen({}); }} aria-label="Chế độ ẩn"
          className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700">
          <option value="none">Hiện tất cả</option>
          <option value="vn">Ẩn Hán Việt & nghĩa</option>
          <option value="k">Ẩn chữ Hán</option>
        </select>
      </div>
      <p className="mb-2 text-xs text-stone-500">
        {rows.length} chữ{hide !== "none" && " · bấm vào dòng để hiện đáp án"}
      </p>
      <Panel className="divide-y divide-stone-100 overflow-hidden">
        {rows.slice(0, limit).map((w) => (
          <div key={w.id} onClick={() => setOpen((o) => ({ ...o, [w.id]: !o[w.id] }))}
            className="flex cursor-pointer gap-3 px-3.5 py-3.5 transition duration-150 hover:bg-stone-50 active:bg-stone-100 sm:px-4">
            <div className="w-14 shrink-0 text-center sm:w-16">
              <div className={cx("text-4xl leading-none text-stone-900 sm:text-5xl", hidden(w, "k") && "invisible")} style={JP}>
                {w.k}
              </div>
              {!hidden(w, "k") && (
                <div className="mt-2 flex justify-center">
                  <KSpeak w={w} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className={hidden(w, "vn") ? "invisible" : ""}>
                <div className="break-words text-[15px] font-bold leading-snug text-red-700">{w.h}</div>
                <div className="mt-0.5 break-words text-sm leading-relaxed text-stone-700">{w.m}</div>
              </div>
              {w.mem && (
                <div className="mt-1.5 break-words text-xs leading-relaxed text-stone-500">💡 {w.mem}</div>
              )}
              <div className="mt-2">
                <Readings w={w} />
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="p-6 text-center text-sm text-stone-500">Không tìm thấy.</div>
        )}
      </Panel>
      {rows.length > limit && (
        <button type="button" onClick={() => setLimit(limit + 60)} className={cx(BTN.ghost, "mt-3 w-full")}>
          Xem thêm ({rows.length - limit} chữ nữa)
        </button>
      )}
    </>
  );
}

function CardView({ pool }) {
  const prof = useProfile();
  const fs = useFocusSession({ secKey: "kanji", kind: "card", label: "Flashcard Hán tự" });
  const known = prof.known.kanji || {};
  const [deck, setDeck] = useState(pool);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [vnFirst, setVnFirst] = useState(false);
  const w = deck[i];
  const [auto, setAuto] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = kanjiSay(w);
    if (auto && t && (vnFirst ? flip : !flip)) speak(t);
  }, [i, flip, vnFirst, auto]);
  const go = (d) => { setFlip(false); setI((x) => (x + d + deck.length) % deck.length); if (d > 0) fs.tick(); };
  useEffect(() => {
    const f = (e) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlip((x) => !x); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });
  const kanjiSide = (
    <div className="text-center">
      <div className="break-words text-7xl leading-tight text-stone-900 sm:text-8xl" style={JP}>{w.k}</div>
      <div className="mt-3 flex justify-center"><KSpeak w={w} lg /></div>
    </div>
  );
  const infoSide = (
    <div className="space-y-2 px-5 text-center">
      <div className="break-words text-2xl font-bold leading-snug text-red-700">{w.h}</div>
      <div className="break-words text-base leading-relaxed text-stone-800 sm:text-lg">{w.m}</div>
      <div className="flex justify-center pt-1"><Readings w={w} /></div>
      {w.mem && <div className="break-words text-xs leading-relaxed text-stone-500">💡 {w.mem}</div>}
    </div>
  );
  const front = vnFirst ? (
    <div className="space-y-1 px-5 text-center">
      <div className="break-words text-2xl font-bold leading-snug text-red-700">{w.h}</div>
      <div className="break-words text-base leading-relaxed text-stone-800">{w.m}</div>
    </div>
  ) : kanjiSide;
  const back = vnFirst ? (
    <div className="space-y-3">
      {kanjiSide}
      <div className="flex justify-center"><Readings w={w} /></div>
      {w.mem && <div className="break-words text-xs leading-relaxed text-stone-500">💡 {w.mem}</div>}
    </div>
  ) : infoSide;
  return (
    <FocusWrap fs={fs}>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-stone-600">
          Thẻ <b className="font-semibold text-stone-900">{i + 1}</b>
          <span className="text-stone-400">/{deck.length}</span>
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Đã thuộc {deck.filter((x) => known[x.id]).length}
        </span>
      </div>

      <ChipRow className="mb-3">
        <Chip onClick={() => { setDeck(shuffle(pool)); setI(0); setFlip(false); }}>Xáo trộn</Chip>
        <Chip onClick={() => { setVnFirst(!vnFirst); setFlip(false); }}>
          Mặt trước: {vnFirst ? "Hán Việt" : "chữ Hán"}
        </Chip>
        <Chip active={auto} onClick={() => setAuto(!auto)}>Tự đọc: {auto ? "Bật" : "Tắt"}</Chip>
      </ChipRow>

      <div
        onClick={() => setFlip(!flip)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlip(!flip); } }}
        className={cx(
          "flex min-h-[17rem] cursor-pointer select-none items-center justify-center rounded-2xl border-2 px-3 py-6 shadow-sm transition duration-150 sm:min-h-[20rem]",
          flip ? "border-emerald-500 bg-emerald-50/60" : "border-stone-200 bg-white",
          known[w.id] && "ring-2 ring-emerald-400"
        )}
      >
        {flip ? back : front}
      </div>
      <p className="mt-2 text-center text-xs text-stone-500">
        Chạm thẻ hoặc phím Space/Enter để lật · phím ← → để chuyển
      </p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => toggleKnown("kanji", w.id)}
          className={cx(
            "w-full rounded-xl border px-4 py-3 text-sm font-semibold transition duration-150 sm:text-base",
            known[w.id]
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          )}
        >
          {known[w.id] ? "Đã thuộc ✓" : "Đánh dấu đã thuộc"}
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => go(-1)} className={cx(BTN.ghost, "py-3")}>← Trước</button>
          <button type="button" onClick={() => go(1)} className={cx(BTN.primary, "py-3 text-sm sm:text-base")}>Sau →</button>
        </div>
      </div>
    </FocusWrap>
  );
}

function makeKQ(pool, dir) {
  const d = dir === "mix" ? (Math.random() < 0.5 ? "k2v" : "v2k") : dir;
  const a = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(pool.filter((x) => x.k !== a.k && x.h !== a.h && short(x) !== short(a))).slice(0, 3);
  return { a, opts: shuffle([a, ...others]), dir: d };
}

function QuizView({ pool }) {
  const fs = useFocusSession({ secKey: "kanji", kind: "quiz", label: "Trắc nghiệm Hán tự" });
  const [dir, setDir] = useState("k2v");
  const [q, setQ] = useState(() => makeKQ(pool, "k2v"));
  const [sel, setSel] = useState(null);
  const [sc, setSc] = useState({ ok: 0, n: 0 });
  const k2v = q.dir === "k2v";
  const next = (d = dir) => { flushPending(); setQ(makeKQ(pool, d)); setSel(null); };
  const choose = (o) => {
    if (sel) return;
    setSel(o);
    const right = o.id === q.a.id;
    setSc((s) => ({ ok: s.ok + (right ? 1 : 0), n: s.n + 1 }));
    record("kanji", q.a.id, right);
    fs.answer(right, { jp: q.a.k, sub: q.a.h, vi: q.a.m });
    const t = kanjiSay(q.a);
    if (t) speak(t);
  };
  useEffect(() => {
    const f = (e) => {
      if (e.key === "Enter" && sel) next();
      else if (/^[1-4]$/.test(e.key) && !sel) choose(q.opts[+e.key - 1]);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });
  if (pool.length < 8)
    return (
      <Panel className="p-4 text-sm text-stone-600">
        Cần thêm chữ để làm trắc nghiệm — hãy chọn phạm vi “Tất cả”.
      </Panel>
    );
  const right = sel && sel.id === q.a.id;
  return (
    <FocusWrap fs={fs}>
      <ProgressHeader ok={sc.ok} n={sc.n} />

      <ChipRow className="mb-3">
        {[["k2v", "Chữ → Hán Việt"], ["v2k", "Hán Việt → Chữ"], ["mix", "Trộn cả hai"]].map(([d, l]) => (
          <Chip key={d} active={dir === d} onClick={() => { setDir(d); next(d); }}>
            {l}
          </Chip>
        ))}
      </ChipRow>

      <Panel className="mb-3 px-4 py-6 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {k2v ? "Chữ Hán này nghĩa là…" : "Từ nào là…"}
        </div>
        {k2v ? (
          <div className="mt-2 break-words text-7xl leading-tight text-stone-900 sm:text-8xl" style={JP}>
            {q.a.k}
          </div>
        ) : (
          <div className="mt-2">
            <div className="break-words text-xl font-bold leading-snug text-red-700 sm:text-2xl">{q.a.h}</div>
            <div className="mt-1 break-words text-base leading-relaxed text-stone-800 sm:text-lg">{q.a.m}</div>
          </div>
        )}
        {sel && (
          <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-left">
            <Readings w={q.a} />
            {q.a.mem && <div className="break-words text-xs leading-relaxed text-stone-500">💡 {q.a.mem}</div>}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {q.opts.map((o, i) => {
          const isRight = o.id === q.a.id;
          let cls = "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50";
          if (sel) {
            if (isRight) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
            else if (sel.id === o.id) cls = "border-red-400 bg-red-50 text-red-800";
            else cls = "border-stone-200 bg-white text-stone-900 opacity-55";
          }
          return (
            <button
              key={o.id}
              type="button"
              disabled={!!sel}
              onClick={() => choose(o)}
              className={cx(
                "flex min-h-[56px] w-full items-start gap-2 rounded-xl border px-3 py-3 text-left transition duration-150 active:scale-[0.99]",
                cls
              )}
            >
              <span className="mt-0.5 text-xs font-semibold text-stone-400">{i + 1}</span>
              <span className="min-w-0 flex-1">
                {k2v ? (
                  <span className="break-words text-sm leading-snug sm:text-base">{short(o)}</span>
                ) : (
                  <span className="block break-words text-3xl leading-none sm:text-4xl" style={JP}>{o.k}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {sel && (
        <Feedback
          ok={right}
          footer={
            <button type="button" onClick={() => next()} className={cx(BTN.primary, "mt-3")}>
              Câu tiếp theo → (Enter)
            </button>
          }
        >
          {right ? (
            <>Chính xác — <b>{short(q.a)}</b></>
          ) : (
            <>Chưa đúng — đáp án đúng: <b>{short(q.a)}</b></>
          )}
        </Feedback>
      )}
    </FocusWrap>
  );
}

// ================= SỐ ĐẾM =================
const { D, KD } = numbersData;

const dig = (n) => (n === 10 ? "じゅう" : D[n]);
const fmt = (n) => n.toLocaleString("en-US");

function grp(n, big) {
  const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
  let k = "", r = "";
  if (th) { k += th === 1 ? (big ? "一千" : "千") : KD[th] + "千"; r += th === 1 ? (big ? "いっせん" : "せん") : th === 3 ? "さんぜん" : th === 8 ? "はっせん" : D[th] + "せん"; }
  if (h) { k += h === 1 ? "百" : KD[h] + "百"; r += h === 1 ? "ひゃく" : h === 3 ? "さんびゃく" : h === 6 ? "ろっぴゃく" : h === 8 ? "はっぴゃく" : D[h] + "ひゃく"; }
  if (t) { k += t === 1 ? "十" : KD[t] + "十"; r += t === 1 ? "じゅう" : D[t] + "じゅう"; }
  if (o) { k += KD[o]; r += D[o]; }
  return [k, r];
}
function readNum(n) {
  if (n === 0) return ["〇", "ゼロ"];
  const parts = [[Math.floor(n / 1e8) % 1e4, "億", "おく"], [Math.floor(n / 1e4) % 1e4, "万", "まん"], [n % 1e4, "", ""]];
  let k = "", r = "";
  for (const [v, ks, rs] of parts) {
    if (!v) continue;
    const [gk, gr] = grp(v, !!ks);
    k += (ks && v === 1 ? "一" : gk) + ks;
    r += (ks && v === 1 ? "いち" : gr) + rs;
  }
  return [k, r];
}

const { PRE, HV } = numbersData;

const COUNTERS = countersList;

function counter(c, n) {
  if (c.sp) return c.sp[n - 1];
  const b = c.r;
  if (c.rule === "h") {
    const [p, v] = HV[b[0]];
    if ([1, 6, 8, 10].includes(n)) return PRE[n] + p + b.slice(1);
    return n === 3 ? "さん" + v + b.slice(1) : dig(n) + b;
  }
  if (c.rule === "k") return PRE[n] ? PRE[n] + b : dig(n) + b;
  if (c.rule === "s") return [1, 8, 10].includes(n) ? PRE[n] + b : dig(n) + b;
  if (c.rule === "kai") return n === 3 ? "さんがい" : PRE[n] ? PRE[n] + b : dig(n) + b;
  return dig(n) + b;
}

const { DAYS, MIN } = numbersData;

const dayR = (n) => {
  if (DAYS[n]) return DAYS[n];
  const t = Math.floor(n / 10), o = n % 10;
  return (t ? (t === 1 ? "じゅう" : D[t] + "じゅう") : "") + (o ? { 7: "しち", 9: "く" }[o] || D[o] : "") + "にち";
};
const monthR = (n) => ({ 4: "し", 7: "しち", 9: "く" }[n] || (n <= 10 ? dig(n) : "じゅう" + D[n - 10])) + "がつ";
const hourR = (n) => ({ 4: "よ", 7: "しち", 9: "く" }[n] || (n <= 10 ? dig(n) : n === 11 ? "じゅういち" : "じゅうに")) + "じ";

const minR = (n) => {
  const t = Math.floor(n / 10), o = n % 10;
  if (!o) return n === 10 ? "じゅっぷん" : D[t] + "じゅっぷん";
  return (t ? (t === 1 ? "じゅう" : D[t] + "じゅう") : "") + MIN[o];
};

const sayJp = (jp) => speak(jp.split("/")[0].trim());
function Say({ jp, sub, hl }) {
  return (
    <button
      type="button"
      onClick={() => sayJp(jp)}
      className={cx(
        "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-2 text-center shadow-sm transition duration-150 active:scale-[0.97]",
        hl ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white hover:border-red-200 hover:bg-red-50/50"
      )}
    >
      <span className="break-words text-[13px] font-medium leading-tight text-stone-900 sm:text-sm">{jp}</span>
      {sub && <span className="break-words text-[11px] leading-tight text-stone-500">{sub}</span>}
    </button>
  );
}
function Block({ title, note, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
      {note && <p className="mt-0.5 mb-2 text-xs leading-relaxed text-stone-500">{note}</p>}
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {children}
      </div>
    </section>
  );
}

function NumBasic() {
  const small = [["0", "〇", "ゼロ / れい"], ["1", "一", "いち"], ["2", "二", "に"], ["3", "三", "さん"], ["4", "四", "よん / し"], ["5", "五", "ご"], ["6", "六", "ろく"], ["7", "七", "なな / しち"], ["8", "八", "はち"], ["9", "九", "きゅう / く"], ["10", "十", "じゅう"]];
  const IRR = [300, 600, 800, 3000, 8000];
  const nums = [20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 100000, 1000000, 10000000, 100000000];
  return (
    <div>
      <p className="text-xs text-stone-500 mb-4">Bấm vào ô để nghe. Ô vàng là cách đọc biến âm cần nhớ.</p>
      <Block title="0 – 10" note="4, 7, 9 có hai cách đọc: dùng よん・なな・きゅう khi đếm số, し・しち・く trong một số từ cố định (4月, 7月, 9月, 4時, 9時…).">
        {small.map(([n, k, r]) => <Say key={n} jp={r} sub={`${n} · ${k}`} hl={["4", "7", "9"].includes(n)} />)}
      </Block>
      <Block title="Chục, trăm, nghìn, vạn…" note="Đọc theo nhóm 4 chữ số: 万 (10⁴) và 億 (10⁸). 一万 luôn đọc いちまん, còn 100 và 1000 thì không cần いち.">
        {nums.map((n) => <Say key={n} jp={readNum(n)[1]} sub={`${fmt(n)} · ${readNum(n)[0]}`} hl={IRR.includes(n)} />)}
      </Block>
    </div>
  );
}

function NumTool() {
  const [v, setV] = useState("12345");
  const n = parseInt(v || "0", 10);
  const [k, r] = readNum(n);
  return (
    <div>
      <input value={v} inputMode="numeric" onChange={(e) => setV(e.target.value.replace(/\D/g, "").slice(0, 11))}
        aria-label="Nhập số"
        placeholder="Nhập một số (tối đa 11 chữ số)…"
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-center text-2xl text-stone-900 placeholder:text-sm placeholder:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100" />
      <div className="my-3 flex flex-wrap gap-2">
        {[7, 25, 300, 4000, 10000, 85000, 600800, 123456789].map((x) => (
          <Chip key={x} onClick={() => setV(String(x))}>{fmt(x)}</Chip>
        ))}
      </div>
      <Panel className="px-4 py-6 text-center">
        <div className="text-sm text-stone-500">{fmt(n)}</div>
        <div className="mt-1 break-all text-3xl font-bold text-stone-900">{k}</div>
        <div className="mt-2 break-all text-xl font-medium text-red-700">{r}</div>
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => sayJp(r)} aria-label="Nghe"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-2xl transition duration-150 hover:border-red-200 hover:bg-red-50 active:scale-95">
            🔊
          </button>
        </div>
      </Panel>
    </div>
  );
}

function NumDate() {
  return (
    <div>
      <Block title="Tháng (月)" note="4月 しがつ, 7月 しちがつ, 9月 くがつ là ba tháng đặc biệt.">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <Say key={n} jp={monthR(n)} sub={`${n}月`} hl={[4, 7, 9].includes(n)} />)}
      </Block>
      <Block title="Ngày (日)" note="Ngày 1–10, 14, 20, 24 đọc riêng. Các ngày khác đọc số + にち (17 và 27 đọc しち, 19 và 29 đọc く).">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <Say key={n} jp={dayR(n)} sub={`${n}日`} hl={!!DAYS[n]} />)}
      </Block>
    </div>
  );
}

function NumTime() {
  return (
    <div>
      <Block title="Giờ (時)" note="4時 よじ, 7時 しちじ, 9時 くじ là ba giờ đặc biệt.">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <Say key={n} jp={hourR(n)} sub={`${n}時`} hl={[4, 7, 9].includes(n)} />)}
      </Block>
      <Block title="Phút (分)" note="Đuôi đổi giữa ふん và ぷん. 30 phút còn nói là 半 (はん).">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 45].map((n) => <Say key={n} jp={minR(n)} sub={`${n}分`} hl={[0, 1, 3, 4, 6, 8].includes(n % 10)} />)}
      </Block>
      <Block title="Tuổi (歳)" note="1, 8, 10 tuổi có っ. 20 tuổi đọc はたち.">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <Say key={n} jp={counter(COUNTERS[11], n)} sub={`${n}歳`} hl={[1, 8, 10].includes(n)} />)}
        <Say jp="はたち" sub="20歳" hl />
      </Block>
    </div>
  );
}

function NumCounters() {
  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-stone-500">
        Bấm vào ô để nghe. Ô vàng là cách đọc biến âm (1, 3, 6, 8, 10 hay bị đổi). Bảng cuộn ngang để xem hết 10 cột.
      </p>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-full text-sm">
          <thead>
            <tr className="text-xs text-stone-500">
              <th className="sticky left-0 z-10 border-r border-stone-200 bg-white p-2 text-left">Đếm</th>
              {Array.from({ length: 10 }, (_, i) => <th key={i} className="p-2 font-medium">{i + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            {COUNTERS.map((c) => (
              <tr key={c.n} className="border-t border-stone-100">
                <td className="sticky left-0 z-10 border-r border-stone-200 bg-white p-2 align-top">
                  <div className="text-xl font-bold" style={JP}>{c.n}</div>
                  <div className="w-28 text-xs leading-snug text-stone-500">{c.note}</div>
                </td>
                {Array.from({ length: 10 }, (_, i) => {
                  const n = i + 1, t = counter(c, n);
                  const hl = c.sp ? (c.n === "つ" || n <= 2 || n === 4) : t !== dig(n) + c.r;
                  return (
                    <td key={n} className="p-1">
                      <button type="button" onClick={() => sayJp(t)}
                        className={cx(
                          "w-full whitespace-nowrap rounded-lg border px-2 py-2 text-center transition duration-150 active:scale-95",
                          hl ? "border-amber-300 bg-amber-50 text-amber-900" : "border-stone-200 bg-white hover:border-red-200 hover:bg-red-50"
                        )}
                        style={JP}>
                        {t}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function makeNQ(max, mode) {
  const L = String(max).length;
  const len = 1 + Math.floor(Math.random() * L);
  const lo = len === 1 ? 1 : 10 ** (len - 1);
  const hi = Math.min(10 ** len - 1, max);
  const n = lo + Math.floor(Math.random() * (hi - lo + 1));
  const reads = new Set([readNum(n)[1]]);
  const opts = [n];
  let guard = 0;
  while (opts.length < 4 && guard++ < 80) {
    const s = String(n).split("");
    s[Math.floor(Math.random() * s.length)] = String(Math.floor(Math.random() * 10));
    const m = parseInt(s.join(""), 10);
    if (m > 0 && m <= max && !reads.has(readNum(m)[1])) { opts.push(m); reads.add(readNum(m)[1]); }
  }
  return { n, mode: mode === "mix" ? pick(["read", "hear"]) : mode, opts: shuffle(opts) };
}

function NumQuiz() {
  const fs = useFocusSession({ secKey: "num", kind: "quiz", label: "Trắc nghiệm số đếm" });
  const [mode, setMode] = useState("read");
  const [max, setMax] = useState(999);
  const [q, setQ] = useState(() => makeNQ(999, "read"));
  const [sel, setSel] = useState(null);
  const [sc, setSc] = useState({ ok: 0, n: 0 });
  const next = (m = mode, x = max) => { flushPending(); setQ(makeNQ(x, m)); setSel(null); };
  const choose = (o) => {
    if (sel !== null) return;
    setSel(o);
    const right = o === q.n;
    setSc((s) => ({ ok: s.ok + (right ? 1 : 0), n: s.n + 1 }));
    record("num", String(q.n), right);
    fs.answer(right, { jp: fmt(q.n), sub: readNum(q.n)[1] });
    sayJp(readNum(q.n)[1]);
  };
  useEffect(() => { if (q.mode === "hear") sayJp(readNum(q.n)[1]); }, [q]);
  useEffect(() => {
    const f = (e) => {
      if (e.key === "Enter" && sel !== null) next();
      else if (/^[1-4]$/.test(e.key) && sel === null && q.opts[+e.key - 1] !== undefined) choose(q.opts[+e.key - 1]);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });
  const [k, r] = readNum(q.n);
  const hear = q.mode === "hear";
  return (
    <FocusWrap fs={fs}>
      <ProgressHeader ok={sc.ok} n={sc.n} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="min-w-[220px] flex-1">
          <Segmented
            items={[
              ["read", "Số → Cách đọc"],
              ["hear", "Nghe → Số"],
              ["mix", "Trộn"],
            ]}
            value={mode}
            onChange={(m) => { setMode(m); next(m); }}
          />
        </div>
        <select
          value={max}
          aria-label="Phạm vi số"
          onChange={(e) => { setMax(+e.target.value); next(mode, +e.target.value); }}
          className="min-h-10 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700"
        >
          <option value={99}>đến 99</option>
          <option value={999}>đến 999</option>
          <option value={9999}>đến 9.999</option>
          <option value={99999999}>đến 99.999.999</option>
        </select>
      </div>

      <Panel className="mb-3 px-4 py-6 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {hear ? "Nghe và chọn số" : "Số này đọc thế nào…"}
        </div>
        {hear ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => sayJp(r)}
              aria-label="Nghe lại"
              className="flex h-16 w-16 items-center justify-center rounded-full border border-stone-300 bg-white text-3xl shadow-sm transition duration-150 hover:border-red-200 hover:bg-red-50 active:scale-95"
            >
              🔊
            </button>
          </div>
        ) : (
          <div className="mt-2 break-words text-5xl font-bold leading-tight text-stone-900 sm:text-6xl">{fmt(q.n)}</div>
        )}
        {sel !== null && (
          <div className="mt-4 space-y-1 border-t border-stone-100 pt-3">
            <div className="break-words text-xl font-semibold text-stone-800">{k}</div>
            <div className="break-words text-lg font-medium text-red-700">{r}</div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {q.opts.map((o, i) => {
          const isRight = o === q.n;
          let cls = "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50";
          if (sel !== null) {
            if (isRight) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
            else if (o === sel) cls = "border-red-400 bg-red-50 text-red-800";
            else cls = "border-stone-200 bg-white text-stone-900 opacity-55";
          }
          return (
            <button
              key={o}
              type="button"
              disabled={sel !== null}
              onClick={() => choose(o)}
              className={cx(BTN.answer, cls)}
            >
              <span className="w-full">
                <span className="mr-1.5 text-xs font-semibold text-stone-400">{i + 1}</span>
                <span className={hear ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}>
                  {hear ? fmt(o) : readNum(o)[1]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {sel !== null && (
        <Feedback
          ok={sel === q.n}
          footer={
            <button type="button" onClick={() => next()} className={cx(BTN.primary, "mt-3")}>
              Câu tiếp theo → (Enter)
            </button>
          }
        >
          {sel === q.n ? (
            <>Chính xác — <b>{r}</b></>
          ) : (
            <>Chưa đúng — đáp án đúng: <b>{r}</b></>
          )}
        </Feedback>
      )}
    </FocusWrap>
  );
}

function NumSection() {
  const TABS = [["basic", "Số cơ bản"], ["tool", "Máy đọc số"], ["date", "Ngày tháng"], ["time", "Giờ & tuổi"], ["count", "Đếm đồ vật"], ["quiz", "Luyện tập"]];
  const [t, setT] = useState("basic");
  return (
    <div style={JP}>
    <Toolbar
      title="Cách đọc số trong tiếng Nhật"
      desc="Số đếm, số lớn, ngày tháng, giờ, tuổi và lượng từ"
      count={`${TABS.length} phần`}
    >
      <Group>
        {TABS.map(([k, l]) => (
          <Chip key={k} active={t === k} onClick={() => setT(k)}>
            {l}
          </Chip>
        ))}
      </Group>
    </Toolbar>

      {t === "basic" && <NumBasic />}
      {t === "tool" && <NumTool />}
      {t === "date" && <NumDate />}
      {t === "time" && <NumTime />}
      {t === "count" && <NumCounters />}
      {t === "quiz" && <NumQuiz />}
    </div>
  );
}

// ================= TỪ VỰNG N5 =================
// Định dạng mỗi dòng: kanji|hiragana/katakana|nghĩa tiếng Việt
const VDATA = vocabList;
const CATS = [...new Set(VDATA.map((w) => w.cat))];
const TOPICS = Object.fromEntries(topicsList.map(({ name, keywords }) => [name, keywords]));

const keyOf = (w) => w.kanji || w.kana.split(/\s*[\/,、]\s*/)[0].trim();
const TOPIC_OF = {};
Object.entries(TOPICS).forEach(([t, str]) => str.split(/\s+/).forEach((k) => { if (k && !(k in TOPIC_OF)) TOPIC_OF[k] = t; }));
VDATA.forEach((w) => { w.topic = TOPIC_OF[keyOf(w)] || "Khác"; });
const TOPIC_NAMES = [...Object.keys(TOPICS), "Khác"];
const main = (w) => w.kanji || w.kana;

function vspeak(w) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const text = w.kana.split(/[,/]/)[0].trim();
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = 0.85;
  const v = synth.getVoices().find((x) => x.lang.replace("_", "-").startsWith("ja"));
  if (v) u.voice = v;
  synth.speak(u);
}

function VSpeak({ w, size = "sm" }) {
  return (
    <button
      type="button"
      title="Nghe phát âm"
      aria-label="Nghe phát âm"
      onClick={(e) => {
        e.stopPropagation();
        vspeak(w);
      }}
      className={`flex shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white transition duration-150 hover:border-red-200 hover:bg-red-50 active:scale-95 ${
        size === "lg" ? "w-12 h-12 text-2xl" : "w-9 h-9 text-base"
      }`}
    >
      🔊
    </button>
  );
}


function VocabSection() {
  const [cat, setCat] = useState("Tất cả");
  const [mode, setMode] = useState("list");
  const [q, setQ] = useState("");
  const [hide, setHide] = useState("none"); // none | vi | jp
  const [revealed, setRevealed] = useState({});

  const [topic, setTopic] = useState("Tất cả");
  const inCat = useMemo(() => (cat === "Tất cả" ? VDATA : VDATA.filter((w) => w.cat === cat)), [cat]);
  const topicCount = useMemo(() => {
    const c = {};
    inCat.forEach((w) => { c[w.topic] = (c[w.topic] || 0) + 1; });
    return c;
  }, [inCat]);
  const pool = useMemo(() => (topic === "Tất cả" ? inCat : inCat.filter((w) => w.topic === topic)), [inCat, topic]);
  const poolKey = cat + "|" + topic;

  return (
    <div style={JP}>
    <Toolbar
      title="Từ vựng N5"
      desc="Từ vựng cơ bản theo loại từ và chủ đề — nghe, lật thẻ, trắc nghiệm"
      count={`${pool.length}/${VDATA.length} từ`}
    >
      <Segmented
        inline
        items={[
          ["list", "Danh sách"],
          ["card", "Flashcard"],
          ["quiz", "Trắc nghiệm"],
        ]}
        value={mode}
        onChange={setMode}
      />
      <Sep />
      <Group label="Loại từ">
        {["Tất cả", ...CATS].map((c) => (
          <Chip
            key={c}
            active={cat === c}
            onClick={() => { setCat(c); setTopic("Tất cả"); }}
          >
            {c}
            <span className={cx("ml-1.5 text-xs", cat === c ? "text-red-100" : "text-stone-400")}>
              {c === "Tất cả" ? VDATA.length : VDATA.filter((w) => w.cat === c).length}
            </span>
          </Chip>
        ))}
      </Group>
      <Sep />
      <Group label="Chủ đề">
        {["Tất cả", ...TOPIC_NAMES].filter((t) => t === "Tất cả" || topicCount[t]).map((t) => (
          <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>
            {t}
            <span className={cx("ml-1.5 text-xs", topic === t ? "text-red-100" : "text-stone-400")}>
              {t === "Tất cả" ? inCat.length : topicCount[t]}
            </span>
          </Chip>
        ))}
      </Group>
    </Toolbar>


      {mode === "list" && (
        <VListView key={poolKey} pool={pool} q={q} setQ={setQ} hide={hide} setHide={setHide} revealed={revealed} setRevealed={setRevealed} />
      )}
      {mode === "card" && <VCardView key={poolKey} pool={pool} />}
      {mode === "quiz" && <VQuizView key={poolKey} pool={pool} />}
    </div>
  );
}

function VListView({ pool, q, setQ, hide, setHide, revealed, setRevealed }) {
  const ql = q.trim().toLowerCase();
  const rows = ql
    ? pool.filter((w) => (w.kanji + w.kana + w.vi).toLowerCase().includes(ql))
    : pool;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm (Nhật hoặc Việt)…"
          aria-label="Tìm kiếm từ vựng"
          className="min-w-[180px] flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
        <select
          value={hide}
          aria-label="Chế độ ẩn"
          onChange={(e) => {
            setHide(e.target.value);
            setRevealed({});
          }}
          className="rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-700"
        >
          <option value="none">Hiện tất cả</option>
          <option value="vi">Ẩn nghĩa tiếng Việt</option>
          <option value="jp">Ẩn tiếng Nhật</option>
        </select>
      </div>
      <p className="mb-2 text-xs text-stone-500">
        {rows.length} từ{hide !== "none" && " · bấm vào dòng để hiện đáp án"}
      </p>
      <Panel className="divide-y divide-stone-100 overflow-hidden">
        {rows.map((w) => {
          const open = hide === "none" || revealed[w.id];
          const toggle = () => hide !== "none" && setRevealed((r) => ({ ...r, [w.id]: !r[w.id] }));
          return (
            <div key={w.id} onClick={toggle}
              className="flex cursor-pointer items-start gap-3 px-3.5 py-3 transition duration-150 hover:bg-stone-50 active:bg-stone-100 sm:px-4">
              <div className="min-w-0 flex-1">
                <div className={cx("break-words text-[15px] font-medium leading-snug text-stone-900", hide === "jp" && !open && "invisible")} style={JP}>
                  {main(w)}
                </div>
                {w.kanji && (
                  <div className={cx("mt-0.5 break-words text-xs leading-snug text-stone-500", hide === "jp" && !open && "invisible")}>
                    {w.kana}
                  </div>
                )}
              </div>
              <div className={cx("min-w-0 flex-1 break-words text-sm leading-snug", hide === "vi" && !open ? "text-stone-300" : "text-stone-700")}>
                {hide === "vi" && !open ? "• • •" : w.vi}
              </div>
              {!(hide === "jp" && !open) && <VSpeak w={w} />}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="p-6 text-center text-sm text-stone-500">Không tìm thấy từ nào.</div>
        )}
      </Panel>
    </>
  );
}

function VCardView({ pool }) {
  const prof = useProfile();
  const fs = useFocusSession({ secKey: "vocab", kind: "card", label: "Flashcard từ vựng" });
  const known = prof.known.vocab || {};
  const [deck, setDeck] = useState(pool);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [viFirst, setViFirst] = useState(false);

  const w = deck[i];
  const [auto, setAuto] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (auto && (viFirst ? flip : !flip)) vspeak(w);
  }, [i, flip, viFirst, auto]);
  const go = (d) => {
    setFlip(false);
    setI((x) => (x + d + deck.length) % deck.length);
    if (d > 0) fs.tick();
  };
  const front = viFirst ? (
    <div className="break-words px-5 text-center text-xl leading-relaxed text-stone-900 sm:text-2xl">{w.vi}</div>
  ) : (
    <div className="break-words px-5 text-center text-4xl font-bold leading-tight text-stone-900 sm:text-5xl" style={JP}>
      {main(w)}
    </div>
  );
  const back = viFirst ? (
    <div className="text-center">
      <div className="break-words px-5 text-4xl font-bold leading-tight text-stone-900 sm:text-5xl" style={JP}>{main(w)}</div>
      {w.kanji && <div className="mt-2 break-words text-lg text-stone-600 sm:text-xl" style={JP}>{w.kana}</div>}
    </div>
  ) : (
    <div className="px-5 text-center">
      {w.kanji && (
        <div className="mb-2 break-words text-xl font-medium text-stone-600 sm:text-2xl" style={JP}>{w.kana}</div>
      )}
      <div className="break-words text-lg leading-relaxed text-stone-900 sm:text-xl">{w.vi}</div>
    </div>
  );

  return (
    <FocusWrap fs={fs}>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-stone-600">
          Từ <b className="font-semibold text-stone-900">{i + 1}</b>
          <span className="text-stone-400">/{deck.length}</span>
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Đã thuộc {deck.filter((x) => known[x.id]).length}
        </span>
      </div>

      <ChipRow className="mb-3">
        <Chip onClick={() => { setDeck(shuffle(pool)); setI(0); setFlip(false); }}>Xáo trộn</Chip>
        <Chip onClick={() => { setViFirst(!viFirst); setFlip(false); }}>
          Mặt trước: {viFirst ? "tiếng Việt" : "tiếng Nhật"}
        </Chip>
        <Chip active={auto} onClick={() => setAuto(!auto)}>Tự đọc: {auto ? "Bật" : "Tắt"}</Chip>
      </ChipRow>

      <div
        onClick={() => setFlip(!flip)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFlip(!flip); } }}
        className={cx(
          "flex min-h-[15rem] cursor-pointer select-none items-center justify-center rounded-2xl border-2 px-3 py-6 shadow-sm transition duration-150 sm:min-h-[17rem]",
          flip ? "border-emerald-500 bg-emerald-50/60" : "border-stone-200 bg-white",
          known[w.id] && "ring-2 ring-emerald-400"
        )}
      >
        <div className="flex w-full flex-col items-center gap-4">
          {flip ? back : front}
          {(flip || !viFirst) && <VSpeak w={w} size="lg" />}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-stone-500">Chạm thẻ để lật</p>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => toggleKnown("vocab", w.id)}
          className={cx(
            "w-full rounded-xl border px-4 py-3 text-sm font-semibold transition duration-150 sm:text-base",
            known[w.id]
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          )}
        >
          {known[w.id] ? "Đã thuộc ✓" : "Đánh dấu đã thuộc"}
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => go(-1)} className={cx(BTN.ghost, "py-3")}>← Trước</button>
          <button type="button" onClick={() => go(1)} className={cx(BTN.primary, "py-3 text-sm sm:text-base")}>Sau →</button>
        </div>
      </div>
    </FocusWrap>
  );
}

function makeQuestion(pool, dir) {
  const d = dir === "mix" ? (Math.random() < 0.5 ? "jp2vi" : "vi2jp") : dir;
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(pool.filter((w) => w.vi !== answer.vi && main(w) !== main(answer))).slice(0, 3);
  return { answer, options: shuffle([answer, ...others]), dir: d };
}

function VQuizView({ pool }) {
  const fs = useFocusSession({ secKey: "vocab", kind: "quiz", label: "Trắc nghiệm từ vựng" });
  const [dir, setDir] = useState("jp2vi");
  const [ques, setQues] = useState(() => makeQuestion(pool, "jp2vi"));
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  if (pool.length < 4) return <p className="text-sm">Cần ít nhất 4 từ để làm trắc nghiệm.</p>;

  const next = (d = dir) => {
    flushPending();
    setQues(makeQuestion(pool, d));
    setPicked(null);
  };
  const choose = (o) => {
    if (picked) return;
    setPicked(o);
    const right = o.id === ques.answer.id;
    setScore((s) => ({ ok: s.ok + (right ? 1 : 0), total: s.total + 1 }));
    record("vocab", ques.answer.id, right);
    fs.answer(right, { jp: main(ques.answer), sub: ques.answer.kanji ? ques.answer.kana : "", vi: ques.answer.vi });
    vspeak(ques.answer);
  };
  const jp2vi = ques.dir === "jp2vi";
  const a = ques.answer;
  if (pool.length < 4)
    return (
      <Panel className="p-4 text-sm text-stone-600">
        Cần ít nhất 4 từ để làm trắc nghiệm — hãy chọn loại từ hoặc chủ đề rộng hơn.
      </Panel>
    );
  const right = picked && picked.id === a.id;

  return (
    <FocusWrap fs={fs}>
      <ProgressHeader ok={score.ok} n={score.total} />

      <ChipRow className="mb-3">
        {[["jp2vi", "Nhật → Việt"], ["vi2jp", "Việt → Nhật"], ["mix", "Trộn cả hai"]].map(([d, l]) => (
          <Chip key={d} active={dir === d} onClick={() => { setDir(d); next(d); }}>
            {l}
          </Chip>
        ))}
      </ChipRow>

      <Panel className="mb-3 px-4 py-6 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {jp2vi ? "Từ này nghĩa là gì…" : "Từ tiếng Việt nào là…"}
        </div>
        {jp2vi ? (
          <>
            <div className="mt-2 break-words text-4xl font-bold leading-tight text-stone-900 sm:text-5xl" style={JP}>
              {main(a)}
            </div>
            {picked && a.kanji && (
              <div className="mt-2 break-words text-base text-stone-600" style={JP}>{a.kana}</div>
            )}
            <div className="mt-4 flex justify-center">
              <VSpeak w={a} size="lg" />
            </div>
          </>
        ) : (
          <>
            <div className="mt-2 break-words text-xl leading-relaxed text-stone-900 sm:text-2xl">{a.vi}</div>
            {picked && (
              <div className="mt-4 flex justify-center">
                <VSpeak w={a} size="lg" />
              </div>
            )}
          </>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {ques.options.map((o) => {
          const isRight = o.id === a.id;
          let cls = "border-stone-200 bg-white text-stone-900 hover:border-stone-300 hover:bg-stone-50";
          if (picked) {
            if (isRight) cls = "border-emerald-500 bg-emerald-50 text-emerald-800";
            else if (picked.id === o.id) cls = "border-red-400 bg-red-50 text-red-800";
            else cls = "border-stone-200 bg-white text-stone-900 opacity-55";
          }
          return (
            <button
              key={o.id}
              type="button"
              disabled={!!picked}
              onClick={() => choose(o)}
              className={cx(
                "flex min-h-[56px] w-full items-center gap-2 rounded-xl border px-3 py-3 text-left transition duration-150 active:scale-[0.99]",
                cls
              )}
            >
              <span className="min-w-0 flex-1">
                {jp2vi ? (
                  <span className="break-words text-sm leading-snug sm:text-base">{o.vi}</span>
                ) : (
                  <span>
                    <span className="break-words text-[15px] font-medium leading-snug" style={JP}>{main(o)}</span>
                    {o.kanji && (
                      <span className="mt-0.5 block break-words text-xs leading-snug text-stone-500" style={JP}>{o.kana}</span>
                    )}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {picked && (
        <Feedback
          ok={right}
          footer={
            <button type="button" onClick={() => next()} className={cx(BTN.primary, "mt-3")}>
              Câu tiếp theo →
            </button>
          }
        >
          {right ? (
            <>Chính xác — <b>{main(a)}</b> {a.kanji && <span style={JP}>({a.kana})</span>}</>
          ) : (
            <>Chưa đúng — đáp án đúng: <b>{main(a)}</b> {a.kanji && <span style={JP}>({a.kana})</span>} — {a.vi}</>
          )}
        </Feedback>
      )}
    </FocusWrap>
  );
}

const NAV = [
  ["kana", "あ", "Chữ cái"],
  ["kanji", "漢", "Hán tự"],
  ["num", "数", "Số đếm"],
  ["vocab", "語", "Từ vựng"],
];

export default function LearnApp({ onHome, initialTab }) {
  const [tab, setTab] = useState(() =>
    ["kana", "kanji", "num", "vocab"].includes(initialTab) ? initialTab : "kana"
  );
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab]);
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" style={JP}>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-2.5 sm:px-6 lg:max-w-4xl">
          {onHome && (
            <button
              type="button"
              onClick={onHome}
              aria-label="Về trang chủ"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-base text-stone-600 transition duration-150 hover:border-red-200 hover:bg-red-50 hover:text-red-700 active:scale-[0.97]"
            >
              ←
            </button>
          )}
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-700 text-lg font-bold text-white shadow-sm"
          >
            あ
          </span>
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-stone-900">KanaLearn</div>
            <div className="truncate text-xs text-stone-500">
              {NAV.find(([k]) => k === tab)?.[2]} · Học tiếng Nhật từng bước
            </div>
          </div>
        </div>
      </header>

      <AchievementToast />

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:max-w-4xl">
        {tab === "kana" && <KanaSection />}
        {tab === "kanji" && <KanjiSection />}
        {tab === "num" && <NumSection />}
        {tab === "vocab" && <VocabSection />}
      </main>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-4 lg:max-w-4xl">
          {NAV.map(([k, icon, label]) => {
            const on = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={on ? "page" : undefined}
                className={cx(
                  "relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 transition duration-150",
                  on ? "text-red-700" : "text-stone-500 hover:text-stone-800"
                )}
              >
                {on && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-red-700" />}
                <span className="text-lg leading-none" style={JP}>{icon}</span>
                <span className={cx("text-[11px] leading-none", on && "font-semibold")}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

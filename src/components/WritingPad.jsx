import { useEffect, useRef, useState } from "react";
import Button from "./common/Button.jsx";
import ListenButton from "./common/ListenButton.jsx";
import { strokesOf } from "../data/strokes.js";
import { useProfile, setWriteScore } from "../lib/progress.js";

// Khung viết: logical 360×360, canvas 720×720 (setTransform ×2). Port từ new.html.
const LOGICAL = 360;
const HALF = LOGICAL / 2;
const SMALL_KANA = "っゃゅょッャュョ";
const DEFAULT_MSG = "Hãy viết theo chữ mờ rồi bấm “Kiểm tra bài viết”.";

const cssv = (n) =>
  (typeof document !== "undefined"
    ? getComputedStyle(document.documentElement).getPropertyValue(n).trim()
    : "") || "#000";

const fontPx = (size) => `${size}px ${cssv("--font-ja-display") || "serif"}`;

/** Vị trí + cỡ từng ký tự trong glyph (âm ghép ghép 2 ký tự, 小書き nhỏ hơn). */
function glyphRuns(glyph) {
  const chars = [...glyph];
  if (chars.length === 1) return [{ ch: chars[0], size: 280, x: HALF, y: 190 }];
  const m = document.createElement("canvas").getContext("2d");
  const runs = chars.map((ch) => ({
    ch,
    size: SMALL_KANA.includes(ch) ? 140 : 170,
    dy: SMALL_KANA.includes(ch) ? 15 : 0,
  }));
  let total = 0;
  for (const r of runs) {
    m.font = fontPx(r.size);
    r.w = m.measureText(r.ch).width;
    total += r.w;
  }
  let x = HALF - total / 2;
  for (const r of runs) {
    r.x = x + r.w / 2;
    r.y = 190 + r.dy;
    x += r.w;
  }
  return runs;
}

/** Vẽ một nét (quadratic smoothing, nét đơn = chấm tròn). */
function strokePath(c, s, lw, col) {
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = lw;
  c.lineCap = "round";
  c.lineJoin = "round";
  if (s.length === 1) {
    c.beginPath();
    c.arc(s[0][0], s[0][1], lw / 2, 0, 7);
    c.fill();
    return;
  }
  c.beginPath();
  c.moveTo(s[0][0], s[0][1]);
  for (let i = 1; i < s.length - 1; i++) {
    const mx = (s[i][0] + s[i + 1][0]) / 2;
    const my = (s[i][1] + s[i + 1][1]) / 2;
    c.quadraticCurveTo(s[i][0], s[i][1], mx, my);
  }
  const l = s[s.length - 1];
  c.lineTo(l[0], l[1]);
  c.stroke();
}

function drawGlyphText(c, glyph, fill, lw) {
  c.textAlign = "center";
  c.textBaseline = "middle";
  for (const r of glyphRuns(glyph)) {
    c.font = fontPx(r.size);
    if (lw) {
      c.lineWidth = lw;
      c.lineJoin = "round";
      c.strokeStyle = fill;
      c.strokeText(r.ch, r.x, r.y);
    }
    c.fillStyle = fill;
    c.fillText(r.ch, r.x, r.y);
  }
}

function drawPad(cv, glyph, strokes, cur, show) {
  const cx = cv.getContext("2d");
  cx.setTransform(2, 0, 0, 2, 0, 0);
  cx.clearRect(0, 0, LOGICAL, LOGICAL);
  cx.strokeStyle = cssv("--border");
  cx.lineWidth = 1;
  cx.setLineDash([6, 6]);
  cx.beginPath();
  cx.moveTo(180, 8);
  cx.lineTo(180, 352);
  cx.moveTo(8, 180);
  cx.lineTo(352, 180);
  cx.stroke();
  cx.setLineDash([]);
  cx.strokeRect(4, 4, 352, 352);
  if (show) {
    cx.globalAlpha = 0.16;
    drawGlyphText(cx, glyph, cssv("--text"));
    cx.globalAlpha = 1;
  }
  const col = cssv("--brand");
  for (const s of strokes) strokePath(cx, s, 12, col);
  if (cur) strokePath(cx, cur, 12, col);
}

function mk360() {
  const c = document.createElement("canvas");
  c.width = c.height = LOGICAL;
  return c;
}
const alphaOf = (c) => c.getContext("2d").getImageData(0, 0, LOGICAL, LOGICAL).data;

/** Điểm khớp = độ phủ × độ chính xác giữa nét vẽ và chữ mẫu (chỉ tham khảo). */
function scoreWrite(glyph, strokes) {
  const m = mk360();
  drawGlyphText(m.getContext("2d"), glyph, "#000");
  const d = mk360();
  drawGlyphText(d.getContext("2d"), glyph, "#000", 44);
  const w = mk360();
  const t = mk360();
  const wc = w.getContext("2d");
  const tc = t.getContext("2d");
  for (const s of strokes) {
    strokePath(wc, s, 30, "#000");
    strokePath(tc, s, 8, "#000");
  }
  const A = alphaOf(m);
  const D = alphaOf(d);
  const W = alphaOf(w);
  const T = alphaOf(t);
  let gp = 0;
  let cov = 0;
  let ink = 0;
  let inside = 0;
  for (let i = 3; i < A.length; i += 4) {
    if (A[i] > 128) {
      gp++;
      if (W[i] > 0) cov++;
    }
    if (T[i] > 128) {
      ink++;
      if (D[i] > 128) inside++;
    }
  }
  const coverage = gp ? cov / gp : 0;
  const prec = ink ? inside / ink : 0;
  return { score: Math.round(100 * coverage * prec), coverage, prec };
}

/**
 * Khung viết tay dùng chung (rule_newFeature.md): nhận glyph, tự lấy số nét chuẩn
 * từ strokes.js (hoặc chuẩn do cha truyền vào), chế độ đồ theo/tự viết.
 * Điểm cao nhất lưu qua setWriteScore — cha đọc lại bằng useProfile().write.
 */
export default function WritingPad({
  glyph,
  reading = "",
  standardStrokes,
  mode = "trace",
  onScore,
  className = "",
}) {
  const p = useProfile();
  const std = standardStrokes ?? strokesOf(glyph);
  const best = (p.write || {})[glyph] || 0;

  const [prevGlyph, setPrevGlyph] = useState(glyph);
  const [strokes, setStrokes] = useState([]);
  const [show, setShow] = useState(mode !== "free");
  const [msg, setMsg] = useState(DEFAULT_MSG);
  const [ok, setOk] = useState(false);
  const [themeTick, setThemeTick] = useState(0);
  const curRef = useRef(null);
  const cvRef = useRef(null);
  const drawingRef = useRef(false);

  // Khóa cuộn trang trong lúc vẽ (mobile): chặn touchmove + treo overflow của <body>
  const lockScroll = () => {
    if (drawingRef.current) return;
    drawingRef.current = true;
    const b = document.body;
    b.dataset.prevOverflow = b.style.overflow;
    b.style.overflow = "hidden";
  };
  const unlockScroll = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const b = document.body;
    b.style.overflow = b.dataset.prevOverflow || "";
    delete b.dataset.prevOverflow;
  };

  useEffect(() => {
    const stopScroll = (e) => {
      if (drawingRef.current) e.preventDefault();
    };
    document.addEventListener("touchmove", stopScroll, { passive: false });
    return () => {
      document.removeEventListener("touchmove", stopScroll);
      unlockScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đổi chữ → xóa nét + khôi phục trạng thái ngay trong lúc render (không cần effect)
  if (prevGlyph !== glyph) {
    setPrevGlyph(glyph);
    setStrokes([]);
    curRef.current = null;
    setShow(mode !== "free");
    setMsg(DEFAULT_MSG);
    setOk(false);
  }

  const drawNow = () => {
    const cv = cvRef.current;
    if (cv) drawPad(cv, glyph, strokes, curRef.current, show);
  };

  // Vẽ lại khi đổi nét/chữ/che chữ mẫu hoặc đổi giao diện
  useEffect(() => {
    drawNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glyph, strokes, show, themeTick]);

  // Theo dõi đổi giao diện (ép tối/sáng) + font tải xong để vẽ lại
  useEffect(() => {
    const mo = new MutationObserver(() => setThemeTick((t) => t + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => setThemeTick((t) => t + 1);
    mq.addEventListener("change", onMq);
    if (document.fonts?.ready) document.fonts.ready.then(() => setThemeTick((t) => t + 1));
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const pt = (e) => {
    const r = cvRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) * LOGICAL) / r.width, ((e.clientY - r.top) * LOGICAL) / r.height];
  };

  const onDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    if (e.pointerType !== "mouse") lockScroll();
    e.currentTarget.setPointerCapture(e.pointerId);
    curRef.current = [pt(e)];
    drawNow();
  };
  const onMove = (e) => {
    const cur = curRef.current;
    if (!cur) return;
    e.preventDefault();
    const np = pt(e);
    const last = cur[cur.length - 1];
    if (Math.hypot(np[0] - last[0], np[1] - last[1]) > 1.5) {
      cur.push(np);
      drawNow();
    }
  };
  const onUp = () => {
    unlockScroll();
    const cur = curRef.current;
    if (!cur) return;
    curRef.current = null;
    setStrokes((s) => [...s, cur]);
  };

  const undo = () => {
    setStrokes((s) => s.slice(0, -1));
    setOk(false);
    setMsg("Đã hoàn tác nét cuối.");
  };
  const clear = () => {
    setStrokes([]);
    setOk(false);
    setMsg("Đã xóa. Hãy viết lại theo chữ mờ.");
  };
  const toggleGuide = () => {
    setShow((v) => !v);
    setOk(false);
    setMsg(DEFAULT_MSG);
  };

  const check = () => {
    if (!strokes.length) {
      setOk(false);
      setMsg("Bạn chưa viết gì. Hãy vẽ lên khung trước.");
      return;
    }
    const n = strokes.length;
    const countPart = std != null ? `Bạn vẽ ${n} nét, chữ chuẩn có ${std} nét. ` : `Bạn vẽ ${n} nét. `;
    if (!show) {
      setOk(false);
      setMsg(
        countPart +
          (std == null
            ? "Bật “Chữ mẫu” để chấm độ khớp."
            : n === std
              ? "Số nét khớp. Bật “Chữ mẫu” để chấm độ khớp."
              : "Số nét khác chuẩn, hãy kiểm tra lại cách viết. Bật “Chữ mẫu” để chấm độ khớp.")
      );
      return;
    }
    const { score, coverage, prec } = scoreWrite(glyph, strokes);
    const lvl =
      score >= 70
        ? "Rất tốt, nét viết bám sát chữ mẫu."
        : score >= 50
          ? "Khá tốt. Thử bám sát hơn vào chữ mờ."
          : "Chưa khớp lắm. Hãy viết chậm và bám theo chữ mờ.";
    setOk(score >= 70);
    setMsg(
      `${countPart}Độ khớp khoảng ${score}% (phủ ${Math.round(coverage * 100)}%, đúng vị trí ${Math.round(
        prec * 100
      )}%). ${lvl}`
    );
    setWriteScore(glyph, score);
    onScore?.(score);
  };

  return (
    <div className={className}>
      <div
        data-write-label
        className="sticky top-[var(--header-h)] z-20 -mx-1 mb-1.5 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--bg)] px-1 py-1 text-[var(--fs-small)] text-[var(--text-muted)] lg:top-0"
      >
        <span className="truncate">
          <span lang="ja" className="ja-display">
            {glyph}
          </span>
          {reading && <> đọc là “{reading}”</>}
        </span>
        <span className="shrink-0">
          Số nét: {strokes.length}
          {std != null && ` (chuẩn: ${std})`}
        </span>
      </div>

      <canvas
        ref={cvRef}
        width={720}
        height={720}
        tabIndex={0}
        aria-label={`Khung viết tay ${glyph}`}
        className="block aspect-square w-full cursor-crosshair touch-none select-none rounded-[var(--radius-sm)] bg-[var(--surface)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="mt-2.5 flex gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={!strokes.length}
          onClick={undo}
        >
          Hoàn tác
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" disabled={!strokes.length} onClick={clear}>
          Xóa
        </Button>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          aria-pressed={show}
          onClick={toggleGuide}
        >
          Chữ mẫu: {show ? "Bật" : "Tắt"}
        </Button>
        <ListenButton text={glyph} size="sm" />
      </div>
      <div className="mt-1.5">
        <Button variant="primary" size="md" className="w-full" onClick={check}>
          Kiểm tra bài viết
        </Button>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={`mt-2.5 min-h-[44px] rounded-[var(--radius-sm)] px-3 py-2.5 text-[var(--fs-small)] leading-snug ${
          ok ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--warning-soft)] text-[var(--warning)]"
        }`}
      >
        {msg}
      </div>

      <p className="mt-2 text-[var(--fs-tiny)] text-[var(--text-faint)]">
        Điểm cao nhất: {best > 0 ? `${best}%` : "—"} · điểm chỉ so với chữ mẫu trên màn hình, để tham khảo, không
        thay thế việc đối chiếu thứ tự nét trong sách hoặc với giáo viên.
      </p>
    </div>
  );
}

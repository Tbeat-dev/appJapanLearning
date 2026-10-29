import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  encodeSync,
  decodeSync,
  mergeProgress,
  syncSummary,
  buildSyncUrl,
  extractSyncCode,
  MAX_CODE,
} from "../lib/sync.js";
import { getP, applyProgress } from "../lib/progress.js";
import kanjiList from "../data/kanji.json";
import vocabList from "../data/vocab.json";

const PROFILE_KEY = "kanalearn.profile";

const cx = (...a) => a.filter(Boolean).join(" ");

const loadProfileCard = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || null;
  } catch {
    return null;
  }
};

const saveProfileCard = (card) => {
  try {
    if (card) localStorage.setItem(PROFILE_KEY, JSON.stringify(card));
  } catch {
    /* ignore quota */
  }
};

const fmtDate = (ms) => {
  if (!ms) return "";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const BTN =
  "rounded-xl px-3.5 py-2.5 text-sm font-semibold transition duration-150 active:scale-[0.98]";

export default function SyncSection({ incomingCode, onConsumed }) {
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [recv, setRecv] = useState("");
  const [msg, setMsg] = useState(null);
  const say = (text, err = false) => setMsg({ text, err });
  const [confirm, setConfirm] = useState(null); // { decoded, fromLink }
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);

  const makeCode = () => {
    try {
      const c = encodeSync(getP(), {
        sizes: { kanji: kanjiList.length, vocab: vocabList.length },
        profile: loadProfileCard(),
      });
      setCode(c);
      setMsg(null);
      return c;
    } catch (e) {
      say("Không tạo được mã đồng bộ", true);
      return null;
    }
  };

  useEffect(() => {
    if (!incomingCode) return;
    handleCode(incomingCode, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCode]);

  useEffect(() => {
    if (!code || code.length > MAX_CODE) {
      setQr("");
      return;
    }
    let alive = true;
    QRCode.toDataURL(buildSyncUrl(code), {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#1c1917", light: "#ffffff" },
    })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [code]);

  const handleCode = (text, fromLink) => {
    const c = extractSyncCode(text);
    if (!c) {
      say("Mã không hợp lệ — hãy dán nguyên chuỗi hoặc link đồng bộ", true);
      return;
    }
    try {
      const decoded = decodeSync(c);
      setRecv(c);
      setConfirm({ decoded, fromLink: !!fromLink });
      setMsg(null);
    } catch {
      say("Mã không hợp lệ hoặc bị hỏng — kiểm tra lại khi dán", true);
    }
  };

  const doMerge = () => {
    if (!confirm) return;
    const { progress, profile } = confirm.decoded;
    applyProgress(progress);
    if (profile) saveProfileCard({ ...loadProfileCard(), ...profile });
    const s = syncSummary(confirm.decoded);
    setConfirm(null);
    say(`Đã gộp tiến trình ✓ (+${s.known} mục đã thuộc, ${s.wrong} từ hay sai, ${s.days} ngày học)`);
    onConsumed?.();
  };

  const stopScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopScan, []);

  const startScan = async () => {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
      say("App này không quét được QR trên máy bạn — dùng camera hệ thống hoặc dán mã/link", true);
      return;
    }
    try {
      setScanning(true);
      setMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      video.playsInline = true;
      await video.play();
      const det = new window.BarcodeDetector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const found = await det.detect(video);
          const raw = found?.[0]?.rawValue;
          const c = raw && extractSyncCode(raw);
          if (c) {
            stopScan();
            handleCode(c, true);
            return;
          }
        } catch {
          /* khung hình chưa sẵn sàng */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      stopScan();
      say("Không mở được camera — cho phép quyền camera rồi thử lại", true);
    }
  };

  const link = code ? buildSyncUrl(code) : "";
  const sum = confirm ? syncSummary(confirm.decoded) : null;

  return (
    <section className="fade-up delay-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Đồng bộ & sao lưu
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
        Tiến trình lưu ngay trên máy bạn. Muốn chuyển sang điện thoại / máy tính khác, tạo một mã
        rồi gửi qua Zalo, email hoặc quét QR — không cần tài khoản, dữ liệu không đi qua máy chủ.
      </p>

      {confirm && (
        <div className="mt-4 rounded-2xl border-2 border-[var(--warning)] bg-[var(--warning-soft)] p-4">
          <p className="text-sm font-bold text-[var(--warning)]">
            Phát hiện tiến trình từ thiết bị khác
            {confirm.fromLink ? " (qua link/QR)" : ""}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--warning)]">
            <li>
              <b>{sum.known}</b> mục đã thuộc · <b>{sum.wrong}</b> từ hay sai · <b>{sum.days}</b>{" "}
              ngày học
            </li>
            <li>Lưu lúc: {fmtDate(confirm.decoded.progress.updatedAt)}</li>
            <li className="text-[var(--warning)]">
              Gộp theo kiểu hợp (đã thuộc = hợp hai máy, hay sai & lịch học = số lớn hơn) — không
              mất dữ liệu của máy nào.
            </li>
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={doMerge}
              className={cx(BTN, "flex-1 bg-[var(--warning)] text-[var(--bg)] hover:bg-[var(--warning)]/85")}
            >
              Gộp vào máy này
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirm(null);
                setRecv("");
                onConsumed?.();
              }}
              className={cx(
                BTN,
                "border border-[var(--warning)] bg-[var(--surface)] text-[var(--warning)] hover:bg-[var(--warning-soft)]"
              )}
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Gửi đi */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h4 className="text-sm font-bold text-[var(--text)]">1 · Gửi từ máy này</h4>
          <button
            type="button"
            onClick={makeCode}
            className={cx(BTN, "mt-3 w-full bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand-hover)]")}
          >
            {code ? "Tạo lại mã đồng bộ" : "Tạo mã đồng bộ"}
          </button>
          {code && (
            <>
              <textarea
                readOnly
                value={code}
                rows={3}
                onFocus={(e) => e.target.select()}
                className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 font-mono text-[10px] leading-relaxed text-[var(--text)]"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () =>
                    (await copy(code)) ? say("Đã sao chép mã ✓") : say("Sao chép thất bại", true)
                  }
                  className={cx(BTN, "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]")}
                >
                  Sao chép mã
                </button>
                <button
                  type="button"
                  onClick={async () =>
                    (await copy(link)) ? say("Đã sao chép link ✓") : say("Sao chép thất bại", true)
                  }
                  className={cx(BTN, "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]")}
                >
                  Sao chép link
                </button>
              </div>
              {qr ? (
                <div className="mt-3 flex flex-col items-center gap-1.5">
                  <img
                    src={qr}
                    alt="Mã QR đồng bộ"
                    className="h-44 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
                  />
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Thiết bị kia mở camera, quét để mở link đồng bộ
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-[11px] text-[var(--warning)]">
                  Mã quá dài để làm QR ({code.length} ký tự) — hãy dùng cách sao chép mã/link, hoặc
                  xuất file trong mục Cài đặt.
                </p>
              )}
              <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                Mã có hiệu lực đến {fmtDate(Date.now())} · dài {code.length} ký tự
              </p>
            </>
          )}
        </div>

        {/* Nhận */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <h4 className="text-sm font-bold text-[var(--text)]">2 · Nhận vào máy này</h4>
          <textarea
            value={recv}
            onChange={(e) => setRecv(e.target.value)}
            rows={3}
            placeholder="Dán mã đồng bộ hoặc link nhận được từ thiết bị khác…"
            className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 font-mono text-[10px] leading-relaxed text-[var(--text)] placeholder:font-sans placeholder:text-[12px] placeholder:text-[var(--text-faint)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCode(recv, false)}
              disabled={!recv.trim()}
              className={cx(
                BTN,
                recv.trim()
                  ? "bg-[var(--text)] text-[var(--bg)] hover:opacity-90"
                  : "cursor-not-allowed bg-[var(--surface-2)] text-[var(--text-faint)]"
              )}
            >
              Gộp tiến trình
            </button>
            <button
              type="button"
              onClick={scanning ? stopScan : startScan}
              className={cx(BTN, "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]")}
            >
              {scanning ? "Tắt camera" : "📷 Quét QR"}
            </button>
          </div>
          {scanning && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-black">
              <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-faint)]">
            Không có mã bên bạn? Nhờ máy kia tạo mã/link/QR rồi gửi sang. Sau khi gộp, hai máy sẽ
            giống nhau ở phần chung.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
        <li>
          <b className="text-[var(--text)]">Cách gộp:</b> từ đã thuộc = hợp hai máy · từ hay sai & lịch
          học = số lớn hơn · cài đặt = bản lưu gần nhất.
        </li>
        <li>
          <b className="text-[var(--text)]">Hạn chế:</b> đồng bộ thủ công (mỗi lần đổi máy phải bấm) —
          bỏ đánh dấu “đã thuộc” trên máy này vẫn quay lại nếu máy kia còn đánh dấu.
        </li>
        <li>
          <b className="text-[var(--text)]">Riêng tư:</b> phần sau dấu # của link không gửi lên máy chủ,
          nên mã đồng bộ chỉ tồn tại ở hai thiết bị của bạn. Dữ liệu nhiều hơn (lịch sử từng câu)
          nên chuyển bằng file trong mục Cài đặt.
        </li>
      </ul>

      {msg && (
        <p
          className={cx(
            "mt-3 text-center text-xs font-medium",
            msg.err ? "text-[var(--danger)]" : "text-[var(--success)]"
          )}
        >
          {msg.text}
        </p>
      )}
    </section>
  );
}

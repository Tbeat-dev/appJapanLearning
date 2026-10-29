import { Volume2 } from "lucide-react";
import { speak, ttsAvailable } from "../../lib/tts.js";
import { useProfile } from "../../lib/progress.js";

const cx = (...a) => a.filter(Boolean).join(" ");

/**
 * Nút nghe phát âm. Tự ẩn khi trình duyệt không hỗ trợ TTS (mục 12).
 * Tôn trọng cài đặt âm thanh trong app.
 */
export default function ListenButton({ text, label, className = "", size = "md" }) {
  const p = useProfile();
  if (!ttsAvailable()) return null;
  if (p.settings?.sound === false) return null;
  const dim = size === "sm" ? "h-10 w-10" : "h-11 w-11";
  return (
    <button
      type="button"
      className={cx(
        "btn-listen inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition duration-150 hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-95",
        dim,
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={label || `Nghe ${text}`}
    >
      <Volume2 aria-hidden="true" className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.75} />
    </button>
  );
}

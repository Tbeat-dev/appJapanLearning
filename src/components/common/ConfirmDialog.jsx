import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Button from "./Button.jsx";

/**
 * Hộp thoại xác nhận: nút hủy được focus trước, nút nguy hiểm ghi động từ cụ thể.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (open && cancelRef.current) cancelRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-2)]"
        style={{ animation: "pop-in 0.2s ease-out both" }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="confirm-title" className="text-[var(--fs-h2)] font-bold text-[var(--text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{body}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} className="sm:min-w-28">
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} className="sm:min-w-28">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

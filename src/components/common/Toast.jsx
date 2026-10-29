import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

const ToastCtx = createContext(null);

/** Toast: hiện 4 giây, dưới điều hướng, aria-live polite, có nút đóng. */
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(0);

  const show = useCallback((text) => {
    setMsg(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 4000);
  }, []);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setMsg(null);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom,0px)+12px)]"
      >
        {msg && (
          <div
            className="toast-in pointer-events-auto flex max-w-md items-center gap-2 rounded-[var(--radius-md)] bg-[var(--text)] px-4 py-3 text-sm font-medium text-[var(--bg)] shadow-[var(--shadow-2)]"
          >
            <span className="min-w-0 flex-1">{msg}</span>
            <button
              type="button"
              onClick={hide}
              aria-label="Đóng thông báo"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] hover:bg-white/10"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast phải nằm trong ToastProvider");
  return ctx;
}

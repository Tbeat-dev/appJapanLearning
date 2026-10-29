import { useRef, useState } from "react";
import { Sun, Moon, Monitor, Download, Upload, Trash2, Eye, EyeOff, Volume2, VolumeX } from "lucide-react";
import Card from "../components/common/Card.jsx";
import Button from "../components/common/Button.jsx";
import { Segmented } from "../components/common/Chip.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import { useToast } from "../components/common/Toast.jsx";
import { useProfile, setSetting, importP, resetP, getP } from "../lib/progress.js";
import { applyTheme } from "../lib/theme.js";
import { DAY_GOALS } from "../components/ProfileSetup.jsx";
import { ttsAvailable } from "../lib/tts.js";

/**
 * Cài đặt — Sáng/Tối, furigana, âm thanh, mục tiêu ngày, xuất/nhập, đặt lại.
 */
export default function Settings({ go }) {
  const p = useProfile();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState(null);
  const fileRef = useRef(null);

  const s = p.settings || {};
  const theme = s.theme || "system";

  const onTheme = (v) => {
    setSetting("theme", v);
    applyTheme(v);
  };

  const onExport = () => {
    try {
      const data = JSON.stringify(getP(), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hiratalearn-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show("Đã xuất file tiến độ.");
    } catch {
      toast.show("Không xuất được file. Thử lại sau.");
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      setConfirmImport(json);
    } catch {
      toast.show("File không hợp lệ. Chọn file JSON đã xuất từ app.");
    }
  };

  return (
    <div className="stagger mx-auto w-full max-w-xl space-y-5">
      <header>
        <p className="text-[var(--fs-tiny)] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Cài đặt
        </p>
        <h1 className="mt-1 text-[var(--fs-h1)] font-bold">Tùy chỉnh app</h1>
      </header>

      <Card>
        <h2 className="text-[var(--fs-h3)] font-semibold">Giao diện</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Chế độ sáng/tối của toàn app.</p>
        <Segmented
          className="mt-3"
          ariaLabel="Chế độ sáng tối"
          value={theme}
          onChange={onTheme}
          options={[
            { value: "light", label: "Sáng" },
            { value: "dark", label: "Tối" },
            { value: "system", label: "Hệ thống" },
          ]}
        />
        <div className="mt-2 flex gap-4 text-[var(--text-faint)]" aria-hidden="true">
          <Sun className="h-4 w-4" /> <Moon className="h-4 w-4" /> <Monitor className="h-4 w-4" />
        </div>
      </Card>

      <Card>
        <h2 className="text-[var(--fs-h3)] font-semibold">Học tập</h2>
        <div className="mt-3 space-y-3">
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              {s.furigana ? <Eye aria-hidden="true" className="h-4 w-4" /> : <EyeOff aria-hidden="true" className="h-4 w-4" />}
              Hiển thị furigana
            </span>
            <input
              type="checkbox"
              checked={s.furigana !== false}
              onChange={(e) => setSetting("furigana", e.target.checked)}
              className="h-5 w-5 rounded-[var(--radius-sm)] border-[var(--border)]"
            />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              {s.sound ? <Volume2 aria-hidden="true" className="h-4 w-4" /> : <VolumeX aria-hidden="true" className="h-4 w-4" />}
              Âm thanh phát âm
              {!ttsAvailable() && (
                <span className="text-[var(--fs-tiny)] text-[var(--text-faint)]">(trình duyệt không hỗ trợ)</span>
              )}
            </span>
            <input
              type="checkbox"
              checked={!!s.sound}
              onChange={(e) => setSetting("sound", e.target.checked)}
              className="h-5 w-5 rounded-[var(--radius-sm)] border-[var(--border)]"
              disabled={!ttsAvailable()}
            />
          </label>
          <div>
            <p className="text-sm font-medium">Mục tiêu học mỗi ngày (lượt)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSetting("goal", g)}
                  aria-pressed={s.goal === g}
                  className={
                    s.goal === g
                      ? "min-h-11 rounded-[var(--radius-md)] bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--on-brand)]"
                      : "min-h-11 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text-muted)]"
                  }
                >
                  {g} lượt
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-[var(--fs-h3)] font-semibold">Dữ liệu</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Tiến độ lưu trên máy này. Xuất file để sao lưu hoặc chuyển thiết bị.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={onExport} className="flex-1">
            <Download aria-hidden="true" className="h-4 w-4" /> Xuất dữ liệu
          </Button>
          <Button variant="secondary" onClick={onPickFile} className="flex-1">
            <Upload aria-hidden="true" className="h-4 w-4" /> Nhập dữ liệu
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={onFile} />
        <Button
          variant="text"
          className="mt-3 w-full text-[var(--danger)]"
          onClick={() => setConfirmReset(true)}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" /> Đặt lại toàn bộ tiến độ
        </Button>
      </Card>

      <Card>
        <h2 className="text-[var(--fs-h3)] font-semibold">Khác</h2>
        <div className="mt-2 flex flex-col gap-2">
          <Button variant="secondary" onClick={() => go("#/profile")}>
            Hồ sơ &amp; đồng bộ
          </Button>
          <Button variant="secondary" onClick={() => go("#/profile")}>
            Thành tựu
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Đặt lại toàn bộ tiến độ?"
        body="Thẻ đã biết, chuỗi ngày học, thành tựu và cài đặt sẽ xoá khỏi máy này. Hành động không thể hoàn tác."
        confirmLabel="Xóa tiến độ"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetP();
          setConfirmReset(false);
          toast.show("Đã đặt lại tiến độ.");
        }}
      />

      <ConfirmDialog
        open={!!confirmImport}
        title="Nhập dữ liệu này?"
        body="Tiến độ hiện tại sẽ bị thay bằng dữ liệu trong file. Hành động không thể hoàn tác."
        confirmLabel="Nhập dữ liệu"
        danger
        onCancel={() => setConfirmImport(null)}
        onConfirm={() => {
          importP(confirmImport);
          setConfirmImport(null);
          toast.show("Đã nhập tiến độ.");
        }}
      />
    </div>
  );
}

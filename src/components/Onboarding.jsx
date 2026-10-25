import { useEffect, useState } from "react";
import ProfileSetup, { loadProfile, profileDone, saveProfile } from "./ProfileSetup.jsx";

const JP = {
  fontFamily: '"Be Vietnam Pro","Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",system-ui,sans-serif',
};

const cx = (...a) => a.filter(Boolean).join(" ");

// Khung bắt buộc mở đầu trên thiết bị mới (kiểu hộp đăng nhập, không tràn toàn trang):
// điền đủ 4 bước mới vào được app
export default function Onboarding({ onDone }) {
  const [p, setP] = useState(loadProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveProfile(p);
    if (saved) {
      const t = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(t);
    }
  }, [p, saved]);

  const set = (k, v) => {
    setP((x) => ({ ...x, [k]: v }));
    setSaved(true);
  };

  const done = profileDone(p);
  const filled = [p.avatar, p.name, p.goal, p.level, p.daily].filter(Boolean).length;

  return (
    <div
      style={JP}
      role="dialog"
      aria-modal="true"
      aria-label="Lập hồ sơ cơ bản"
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-sm"
    >
      <div className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="border-b border-stone-100 px-6 pb-5 pt-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-700 text-xl font-bold text-white shadow-sm"
          >
            あ
          </span>
          <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            Bước đầu tiên
          </span>
          <h1 className="mt-2.5 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">Lập hồ sơ cơ bản</h1>
          <p className="mt-1.5 text-sm leading-snug text-stone-600">
            Chọn mục tiêu và phong cách học — dữ liệu lưu ngay trên máy bạn, không cần đăng nhập.
          </p>
        </div>

        <div className="max-h-[58vh] overflow-y-auto overscroll-contain px-6 py-5">
          <ProfileSetup p={p} set={set} done={done} saved={saved} actions={false} compact />
        </div>

        <div className="border-t border-stone-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs font-semibold tabular-nums text-stone-500">{filled}/5</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-red-600 transition-[width] duration-300"
                style={{ width: (filled / 5) * 100 + "%" }}
              />
            </div>
            <button
              type="button"
              disabled={!done}
              onClick={() => onDone?.()}
              className={cx(
                "shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-150",
                done
                  ? "bg-red-700 text-white shadow-sm hover:bg-red-800 active:scale-[0.98]"
                  : "cursor-not-allowed bg-stone-200 text-stone-400"
              )}
            >
              Bắt đầu →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

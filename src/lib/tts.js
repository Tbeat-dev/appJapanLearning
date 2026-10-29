// Phát âm tiếng Nhật bằng Web Speech API. Ẩn nút nghe khi trình duyệt không hỗ trợ.

let cachedOk;

export function ttsAvailable() {
  if (cachedOk !== undefined) return cachedOk;
  cachedOk = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  return cachedOk;
}

let jaVoice;

function pickVoice() {
  if (jaVoice) return jaVoice;
  const voices = window.speechSynthesis.getVoices() || [];
  jaVoice =
    voices.find((v) => v.lang === "ja-JP") ||
    voices.find((v) => v.lang.startsWith("ja")) ||
    null;
  return jaVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    jaVoice = null;
    pickVoice();
  };
}

export function speak(text) {
  if (!ttsAvailable() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = "ja-JP";
    u.rate = 0.9;
    const v = pickVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function markTtsUnavailableClass() {
  if (typeof document === "undefined") return;
  if (!ttsAvailable()) document.documentElement.classList.add("tts-unavailable");
}

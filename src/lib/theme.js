// Áp dụng chế độ sáng/tối: "system" | "light" | "dark" (data-theme trên <html>)

const KEY = "kanalearn.theme";

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
  else root.removeAttribute("data-theme");
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", mode === "dark" ? "#121110" : "#F7F6F4");
}

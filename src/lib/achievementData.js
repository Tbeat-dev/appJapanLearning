// Hệ thống thành tựu: chỉ gồm định nghĩa và hàm tính, không phụ thuộc giao diện hay store.

export const fmtDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function calcStreak(days) {
  const d = new Date();
  if (!days[fmtDate(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[fmtDate(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export const CATS = ["Từ vựng", "Hán tự", "Luyện tập", "Chăm chỉ", "Đặc biệt"];

// Các số liệu dùng để xét thành tựu, tính từ hồ sơ
export function metrics(p) {
  const st = p.stats || {};
  const sum = (k) => Object.values(st).reduce((a, s) => a + (s[k] || 0), 0);
  const answers = sum("total"), ok = sum("ok");
  return {
    vocab: Object.keys(p.known.vocab || {}).length,
    kanji: Object.keys(p.known.kanji || {}).length,
    answers, ok,
    acc: answers ? Math.round((ok / answers) * 100) : 0,
    combo: p.bestCombo || 0,
    streak: calcStreak(p.days || {}),
    daysStudied: Object.values(p.days || {}).filter((n) => n > 0).length,
    kanaOk: (st.kana && st.kana.ok) || 0,
    numOk: (st.num && st.num.ok) || 0,
    cleared: p.cleared || 0,
    goalDays: p.goalDays || 0,
    early: p.flags && p.flags.early ? 1 : 0,
    late: p.flags && p.flags.late ? 1 : 0,
  };
}

// group(nhóm, tiền tố id, số liệu, mô tả, [[mốc, tên, biểu tượng, điểm], ...])
const group = (cat, id, key, label, rows) =>
  rows.map(([target, name, icon, pts]) => ({ id: id + target, cat, name, icon, pts, target, desc: label(target), get: (m) => m[key] }));

export const ACH = [
  ...group("Từ vựng", "v", "vocab", (n) => `Đánh dấu thuộc ${n} từ vựng`, [[10, "Mầm non", "🌱", 10], [50, "Quen mặt", "🌿", 20], [100, "Trăm từ", "🌳", 30], [300, "Nửa chặng", "🏔️", 50], [601, "Bậc thầy N5", "👑", 100]]),
  ...group("Hán tự", "k", "kanji", (n) => `Đánh dấu thuộc ${n} chữ Hán`, [[10, "Nét đầu tiên", "✏️", 10], [50, "Biết mặt chữ", "🖌️", 20], [200, "Thư pháp gia", "📜", 40], [500, "Học giả", "🎓", 60], [1000, "Đại sư Hán tự", "🏯", 100]]),
  ...group("Luyện tập", "a", "answers", (n) => `Trả lời ${n} câu trắc nghiệm`, [[25, "Khởi động", "🎯", 10], [100, "Siêng luyện", "💪", 20], [500, "Chiến binh", "⚔️", 40], [1000, "Huyền thoại", "🏆", 80]]),
  { id: "acc80", cat: "Luyện tập", name: "Chính xác", icon: "🎯", pts: 30, target: 80, unit: "%", desc: "Đúng từ 80% sau ít nhất 30 câu", get: (m) => (m.answers >= 30 ? m.acc : 0), hint: (m) => (m.answers < 30 ? `Cần thêm ${30 - m.answers} câu` : null) },
  { id: "acc90", cat: "Luyện tập", name: "Xạ thủ", icon: "🏹", pts: 60, target: 90, unit: "%", desc: "Đúng từ 90% sau ít nhất 100 câu", get: (m) => (m.answers >= 100 ? m.acc : 0), hint: (m) => (m.answers < 100 ? `Cần thêm ${100 - m.answers} câu` : null) },
  ...group("Luyện tập", "c", "combo", (n) => `Trả lời đúng liên tiếp ${n} câu`, [[5, "Liên hoàn", "🔥", 10], [10, "Chuỗi thắng", "⚡", 25], [20, "Bất bại", "💎", 50]]),
  ...group("Luyện tập", "ka", "kanaOk", (n) => `Đúng ${n} câu ở phần chữ cái`, [[50, "Thuộc bảng chữ", "あ", 20]]),
  ...group("Luyện tập", "nu", "numOk", (n) => `Đúng ${n} câu ở phần số đếm`, [[20, "Nhà toán học", "数", 20]]),
  ...group("Luyện tập", "cl", "cleared", (n) => `Ôn xong ${n} mục trong danh sách từ hay sai`, [[10, "Sửa lỗi", "🛠️", 25]]),
  ...group("Chăm chỉ", "s", "streak", (n) => `Học ${n} ngày liên tiếp`, [[3, "Ba ngày", "📅", 15], [7, "Một tuần", "🗓️", 30], [14, "Hai tuần", "🔥", 50], [30, "Một tháng", "🌕", 100]]),
  ...group("Chăm chỉ", "d", "daysStudied", (n) => `Học tổng cộng ${n} ngày`, [[10, "Quay lại", "📆", 20], [30, "Gắn bó", "🧡", 40], [100, "Trăm ngày", "💯", 100]]),
  ...group("Chăm chỉ", "g", "goalDays", (n) => `Đạt mục tiêu trong ngày ${n} lần`, [[1, "Đạt mục tiêu", "✅", 10], [7, "Kỷ luật", "🎖️", 40]]),
  ...group("Đặc biệt", "e", "early", () => "Học trong khoảng 4 giờ đến 7 giờ sáng", [[1, "Chim sớm", "🌅", 15]]),
  ...group("Đặc biệt", "l", "late", () => "Học từ 22 giờ đêm đến gần 4 giờ sáng", [[1, "Cú đêm", "🌙", 15]]),
];

export const isDone = (a, m) => a.get(m) >= a.target;

// Danh sách id vừa đạt được mà chưa lưu trong p.ach
export function newlyUnlocked(p) {
  const m = metrics(p), have = p.ach || {};
  return ACH.filter((a) => !have[a.id] && isDone(a, m)).map((a) => a.id);
}

export const TITLES = ["Người mới", "Học trò", "Chăm chỉ", "Thông thạo", "Cao thủ", "Sư phụ", "Bậc thầy"];
// Cấp n cần 20·n·(n−1) điểm
export function levelInfo(points) {
  const level = Math.floor((1 + Math.sqrt(1 + points / 5)) / 2);
  const from = 20 * level * (level - 1), to = 20 * (level + 1) * level;
  return { level, title: TITLES[Math.min(level - 1, TITLES.length - 1)], from, to, pct: Math.round(((points - from) / (to - from)) * 100) };
}
export const totalPoints = (p) => ACH.reduce((a, x) => a + (p.ach && p.ach[x.id] ? x.pts : 0), 0);

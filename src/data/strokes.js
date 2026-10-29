// Số nét (画数) theo hình viết tay教科書体. Nguồn: KanjiVG (Ulrich Apel, CC BY-SA 3.0,
// kanjivg.tagaini.net) và bảng 笔順 của教科書会社 (教育出版 / 日本文教出版).
// Chỉ dùng để ĐẾM số nét — không hiển thị hướng hay thứ tự nét.

const BASE = {
  あ: 3, い: 2, う: 2, え: 2, お: 3,
  か: 3, き: 4, く: 1, け: 3, こ: 2,
  さ: 3, し: 1, す: 2, せ: 3, そ: 1,
  た: 4, ち: 2, つ: 1, て: 1, と: 2,
  な: 4, に: 3, ぬ: 2, ね: 2, の: 1,
  は: 3, ひ: 1, ふ: 4, へ: 1, ほ: 4,
  ま: 3, み: 2, む: 3, め: 2, も: 3,
  や: 3, ゆ: 2, よ: 2,
  ら: 2, り: 2, る: 1, れ: 2, ろ: 1,
  わ: 2, を: 3, ん: 1,

  ア: 2, イ: 2, ウ: 3, エ: 3, オ: 3,
  カ: 2, キ: 3, ク: 2, ケ: 3, コ: 2,
  サ: 3, シ: 3, ス: 2, セ: 2, ソ: 2,
  タ: 3, チ: 3, ツ: 3, テ: 3, ト: 2,
  ナ: 2, ニ: 2, ヌ: 2, ネ: 4, ノ: 1,
  ハ: 2, ヒ: 2, フ: 1, ヘ: 1, ホ: 4,
  マ: 2, ミ: 3, ム: 2, メ: 2, モ: 3,
  ヤ: 2, ユ: 2, ヨ: 3,
  ラ: 2, リ: 2, ル: 2, レ: 1, ロ: 3,
  ワ: 2, ヲ: 3, ン: 2,

  っ: 1, ゃ: 3, ゅ: 2, ょ: 2,
  ッ: 3, ャ: 2, ュ: 2, ョ: 3,
};

const VOICED = 2;
const SEMI_VOICED = 1;

function strokeOfChar(ch) {
  if (BASE[ch] != null) return BASE[ch];
  const nfd = ch.normalize("NFD");
  if (nfd.length === 2) {
    const base = BASE[nfd[0]];
    if (base != null) {
      if (nfd[1] === "゙") return base + VOICED;
      if (nfd[1] === "゚") return base + SEMI_VOICED;
    }
  }
  return null;
}

/** Số nét chuẩn của một chữ (kể cả âm ghép 2 ký tự); null nếu chưa có dữ liệu. */
function strokesOf(glyph) {
  if (!glyph) return null;
  let total = 0;
  for (const ch of glyph) {
    const n = strokeOfChar(ch);
    if (n == null) return null;
    total += n;
  }
  return total;
}

export { strokesOf, strokeOfChar };

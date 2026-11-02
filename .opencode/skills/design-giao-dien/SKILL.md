---
name: design-giao-dien
description: Design system của HirataLearn — dùng khi viết hoặc sửa bất kỳ mã giao diện nào (UI, màu, font, typography, spacing, layout, animation, dark mode, component, eyebrow, card, button) trong src/. Bắt từ khóa "thiết kế giao diện", "đổi màu", "font", "token", "typography", "layout", "animation".
---

# Thiết kế giao diện HirataLearn

Toàn bộ visual phải đi qua design token và component có sẵn. Mục tiêu: màn hình mới
phải giống hệt các màn hiện có, chạy đúng cả light lẫn dark, không thêm CSS tùy biến.

## 1. Token trước tiên — cấm magic value

- Nguồn token duy nhất: `src/styles/variables.css`. KHÔNG dùng hex, px, font-family
  ngoài file này.
- Tailwind viết token qua arbitrary value:
  - Màu: `bg-[var(--surface)]`, `text-[var(--text-muted)]`, `border-[var(--border)]`
  - Cỡ chữ: `text-[var(--fs-body)]`, `text-[var(--fs-label)]` — **không** `text-[11px]`
  - Bo góc: `rounded-[var(--radius-md)]` · Bóng: `shadow-[var(--shadow-1)]`
- Số liệu (tỉ lệ, điểm, ngày, "x/y") luôn kèm class `.tabular` (tabular-nums).
- Số lớn (điểm tổng, thành tích): class `.display tabular`.
- Số đếm lớn >999: `n.toLocaleString("vi-VN")`.
- Chặn kiểm tra nhanh: grep mã mới tìm hex `#[0-9A-Fa-f]{3,8}` hoặc `text-[0-9]+px` —
  không được có kết quả (trừ `variables.css`).

## 2. Thang chữ (variables.css mục 3)

| Token | Dùng cho |
|---|---|
| `--fs-display` | số lớn, câu hỏi quiz to |
| `--fs-h1` | h1 của trang |
| `--fs-h2` | h1 trong trang con (Lesson, Review) |
| `--fs-h3` | tiêu đề card/nhóm |
| `--fs-body` | nội dung chính (16px) |
| `--fs-small` / `--fs-tiny` | mô tả phụ / chú thích |
| `--fs-label` | nhãn nhỏ, caption, badge (11px) |

- h1 luôn `text-[var(--fs-h1)] font-bold`; heading giữ nguyên `font-weight: 700` từ
  `global.css`, không tự viết `font-semibold` cho h2/h3 trong nội dung.
- Vietnamese UI font là `--font-ui` (Be Vietnam Pro) — kế thừa từ body, không cần
  chỉ định lại.

## 3. Eyebrow & cấu trúc đầu trang (bắt buộc thống nhất)

```jsx
<header>
  <p className="eyebrow eyebrow-rgb">Tên khu vực</p>   // nhãn CẤP TRANG — đỏ gradient
  <h1 className="mt-1 text-[var(--fs-h1)] font-bold">Tiêu đề</h1>
</header>
```

- `.eyebrow eyebrow-rgb` + h1: dùng cho đầu trang cấp mục (Lộ trình, Thư viện,
  Trang chủ…).
- `.eyebrow eyebrow-quiet`: nhãn NHỎ bên trong card/section — không dùng rgb.
- Không thêm eyebrow nếu h1 trùng tên tab đang chọn (màn chính kiểu Review/Test
  chỉ có h1).
- Màn có nút quay lại: nút `h-11 w-11` bên trái, đặt TRƯỚC khối eyebrow + h1.
- Màn con (Lesson): h1 `text-[var(--fs-h2)]` + dòng meta `text-xs` + `ProgressBar`.

## 4. Component — dùng lại, không viết lại

`src/components/common/`: `Card`, `Button` (variants `primary|secondary|ghost`),
`Chip` (+ `LevelBadge`, `Segmented`), `ListenButton`, `EmptyState`, `Skeleton`,
`ProgressBar`, `Toast`, `ConfirmDialog`, `StepDots`.

- Tùy chỉnh chỗ dùng: truyền `className` kèm Tailwind override `!` (vd
  `<Card className="!flex !items-start !gap-3">`), không sửa component dùng chung
  cho một chỗ.
- Danh sách item: `<ul className="stagger space-y-2">` + `<li>` (stagger tự giãn
  10 con đầu, .fade-up cho delay theo index).
- Card tappable (đi tới màn khác): kiểu nút full-width như LibraryIndex —
  `hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] active:scale-[0.995]`.
- Grid thẻ: `grid gap-3 sm:grid-cols-2`; hàng danh sách: `space-y-2`.

## 5. Chữ Nhật

- Mọi phần tiếng Nhật: `lang="ja"` (CSS `:lang(ja)` tự gắn font).
- Glyph lớn (kana/hán/pattern): class `.ja-display` (serif Noto Serif JP).
- Câu ví dụ trong danh sách: inline `style={{ fontFamily: "var(--font-ja)" }}`
  hoặc `lang="ja"` + `text-[15px]`.
- Romaji/reading nhỏ: class `.romaji` — không tự đặt cỡ/màu cho reading.
- Nút nghe: `<ListenButton text={...} size="sm" label="Nghe ..." />` — label tiếng Việt.

## 6. Chuyển động

- Class có sẵn trong `src/index.css`: `.fade-in`, `.fade-up` (kèm `style={{ animationDelay }}`),
  `.hero-in hero-in-N` (N=1..5 cho các khối đầu trang), `.stagger > *` (con tự trễ).
- Không viết keyframe/animation mới nếu class cũ đủ; `prefers-reduced-motion` đã
  tắt toàn bộ tự động.

## 7. Dark mode & truy cập

- Chỉ dùng token → dark mode tự hoạt động (`data-theme` + `prefers-color-scheme`).
  Không viết media-query màu riêng trong component.
- Touch target ≥ 44px: nút icon dùng `h-11 w-11`; nút hành động `min-h-14` khi cần.
- Vòng focus global đã có — không bao giờ `outline: none`.
- aria tiếng Việt: `aria-label`, `aria-pressed` cho toggle; input cần `aria-label`.

## 8. Kiểm tra sau khi sửa

1. `npm run build` phải PASS (warning chunk >500kB là pre-existing, bỏ qua).
2. Không còn hardcoded value (grep hex/px — mục 1).
3. Mới thêm section/page? Đối chiếu layout với màn gần nhất (vd `Library.jsx`,
   `Roadmap.jsx`) để giữ nhịp spacing `space-y-5` giữa các khối.

## 9. Tham chiếu

- Token: `src/styles/variables.css` · Base + utility: `src/styles/global.css`
  · Animation: `src/index.css`
- Mẫu màn hình chuẩn: `src/pages/Library.jsx` (index + list + search + filter),
  `src/pages/Roadmap.jsx` (hàng list + trạng thái lock/done),
  `src/pages/Lesson.jsx` (lý thuyết → luyện → kết quả).

# Vị trí đặt phần luyện viết chữ trong HirataLearn

Thường thì luyện viết **không phải một tab riêng** trên thanh điều hướng chính. Nó là một thành phần dùng chung, xuất hiện ở nhiều chỗ khác nhau. Đây là cách làm phổ biến theo hiểu biết chung, chưa kiểm chứng với từng app cụ thể.

## 1. Nên đặt ở 3 chỗ

| Vị trí | Cách xuất hiện | Vì sao |
|---|---|---|
| **1. Trong bài học (Lộ trình)** | Một bước của bài kana hoặc kanji: Học chữ → Nghe → **Viết** → Kiểm tra nhanh | Người học vừa nhìn xong chữ là viết luôn, dễ nhớ hơn. Đây là chỗ dùng nhiều nhất. |
| **2. Trong Thư viện** | Ở trang chi tiết của từng chữ (Bảng chữ cái, Hán tự) có nút "Luyện viết" | Để người học tự chọn chữ muốn tập, không cần theo lộ trình. |
| **3. Trong Ôn tập** | Thêm chế độ "Viết" cho các chữ hay sai | Viết lại chữ hay quên giúp nhớ lâu hơn là chỉ chọn đáp án. |

Thanh điều hướng chính giữ nguyên 5 tab (Hôm nay, Lộ trình, Ôn tập, Luyện đề, Thư viện). Thêm tab thứ sáu cho luyện viết sẽ làm giao diện rối mà không giúp ích nhiều.

## 2. Cách làm để dễ phát triển

- **Viết một thành phần duy nhất** (`WritingPad`) nhận vào chữ cần viết, số nét chuẩn và chế độ đồ theo hoặc tự viết. Cả ba chỗ trên dùng lại thành phần này, chỉ khác phần bao quanh.
- **Dùng chung dữ liệu tiến độ:** điểm luyện viết của mỗi chữ lưu cùng chỗ với kết quả trắc nghiệm, để màn hình "Ôn tập" biết chữ nào cần luyện thêm.
- **Trên điện thoại:** khung viết nên chiếm gần hết chiều ngang, nút Xóa và Hoàn tác đặt cạnh nhau ở dưới. Cần chặn cuộn trang khi vẽ.
- **Dữ liệu thứ tự nét** nên lấy từ nguồn có giấy phép rõ ràng, chẳng hạn KanjiVG (cần ghi nguồn). Nếu chưa có thì chỉ nên đếm số nét như bản mẫu trước đó, không tự hiển thị thứ tự nét.

## 3. Thứ tự triển khai đề xuất

1. Đặt vào bài học kana trong Lộ trình.
2. Thêm nút "Luyện viết" ở trang chi tiết trong Thư viện.
3. Thêm chế độ "Viết" trong Ôn tập.

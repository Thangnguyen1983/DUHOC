# Banner đầu trang: thêm chế độ "Ảnh thuần 100%" + chuẩn hoá độ đọc

## Trả lời nhanh cho phương án bạn đề xuất

Có — với những ảnh poster **đã có sẵn tiêu đề, số liệu, bố cục riêng** (như banner Canada), thì ẩn chữ/CTA khỏi ảnh và để ảnh hiển thị 100% độ sáng là phương án **tốt hơn hẳn**: hết chồng chữ, ảnh thiết kế được tôn trọng nguyên vẹn, tốc độ đọc nhanh hơn.

Hai điều cần lưu ý, và kế hoạch sẽ xử lý luôn:
- H1 vẫn phải tồn tại dưới dạng chữ thật (không nằm trong ảnh) để Google hiểu trang — nên chữ không bị xoá, mà **chuyển xuống ngay dưới ảnh**.
- CTA nằm trong ảnh thì không bấm được — nên CTA cũng chuyển xuống dải dưới ảnh, luôn hiển thị rõ.

Vì vậy không chọn cứng một kiểu cho toàn site, mà thêm **tuỳ chọn chế độ hero** để mỗi trang tự chọn theo loại ảnh.

## Sẽ làm

### 1. Thêm chế độ hiển thị hero (chọn trong admin)
- **Ảnh thuần (mới, mặc định cho ảnh poster)** — ảnh full-width, 100% độ sáng, không lớp phủ, không chữ đè. Bên dưới ảnh là một dải nội dung nền trắng chứa: eyebrow, H1, mô tả ngắn, 2 nút CTA, rồi tới dải Quick Stats.
- **Chữ đè ảnh (kiểu hiện tại)** — giữ nguyên cho các trang dùng ảnh chụp thường, nhưng được chỉnh lại độ tương phản (mục 2).

### 2. Chỉnh lại chế độ "chữ đè ảnh" cho dễ đọc
- Tăng độ đậm lớp phủ; riêng lớp phủ `light` đổi thành nền sáng thật (trắng ~80% + blur nhẹ) thay vì gradient trong suốt.
- Thêm scrim từ trái sang để cột chữ luôn nằm trên nền phẳng.
- Đảm bảo tương phản tiêu đề/mô tả ≥ 4.5:1.

### 3. Bố cục và phông chữ (áp dụng cho cả hai chế độ)
- Ảnh hero giữ tỷ lệ ổn định (21:9 desktop / 4:3 mobile), không bị xén mất chủ thể.
- H1: giảm một bậc cỡ chữ (`text-3xl → 5xl`), `leading-[1.15]`, `font-bold`; mô tả tăng độ đậm màu, giới hạn ~640px bề rộng để dòng không quá dài.
- Eyebrow giảm letter-spacing để dấu tiếng Việt không bị rời rạc; kiểm tra các ký tự khó (ỹ, ặ, ữ, ọ).
- Dải Quick Stats không còn đè lên ảnh — nằm gọn dưới khối nội dung.
- Mobile 360px: không tràn ngang, CTA xếp dọc, mỗi nút ≥ 44px.

### 4. Sửa lỗi dữ liệu đang thấy
- Chip badge "KR" hiển thị nhầm trên trang Canada.

### 5. Ghi chú trong admin
- Ở trang cấu hình banner: nêu rõ khi nào chọn "Ảnh thuần" (ảnh thiết kế sẵn có chữ) và khi nào chọn "Chữ đè ảnh" (ảnh chụp thường), kèm kích thước khuyến nghị 1920×900, < 400KB.

## Chi tiết kỹ thuật

- `src/components/premium-hero.tsx`: thêm nhánh render `layout: "image" | "overlay"`, viết lại bảng `OVERLAYS`, tách khối stats khỏi vùng đè, chuẩn hoá typography.
- `src/components/page-hero.tsx`: đồng bộ cùng thang chữ và lớp phủ.
- `page_banners`: thêm cột `layout` (mặc định `overlay`) + cập nhật kiểu dữ liệu và form trong `src/routes/_authenticated/admin.page-banners.tsx`.
- Trang Canada (và các trang dùng ảnh poster) đặt sang `layout = image`.
- Không đổi nội dung bài viết, không đổi logic nghiệp vụ khác.

## Kiểm chứng

- Chụp lại hero ở 360px và 1440px cho Du học Canada (chế độ ảnh thuần) và một trang dùng ảnh chụp thường (chế độ chữ đè).
- Kiểm tra H1 vẫn là chữ thật trong HTML, CTA bấm được, tương phản đạt chuẩn.

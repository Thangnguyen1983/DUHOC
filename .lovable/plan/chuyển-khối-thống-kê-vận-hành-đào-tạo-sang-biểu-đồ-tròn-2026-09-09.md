# Chuyển khối thống kê Vận hành & Đào tạo sang biểu đồ tròn

## Mục tiêu
Trên trang `/admin/van-hanh`, chuyển 4 khối thống kê dạng thanh ngang (bar) sang **biểu đồ tròn (donut/pie) có màu sắc phân biệt**, kèm **chú thích (legend) có số liệu ngay dưới biểu đồ**.

## Phạm vi thay đổi
Chỉ thay phần hiển thị trong `src/routes/_authenticated/admin.van-hanh.tsx`. Không đổi dữ liệu, không đổi `src/lib/operations/overview.functions.ts`, không đụng quyền truy cập.

4 khối được chuyển:
1. Học viên theo trạng thái
2. Hồ sơ visa
3. Học viên theo chương trình
4. Thị trường / nước đến

Các phần khác giữ nguyên: 4 thẻ KPI đầu trang, 3 thẻ cảnh báo, danh sách lớp/hợp đồng, thẻ truy cập nhanh.

## Thiết kế biểu đồ
- Dùng **recharts** (đã có sẵn trong dự án, không cài thêm) — `PieChart` dạng donut (lỗ giữa), hiển thị tổng số ở tâm.
- Bảng màu cố định theo thứ tự mục (đỏ Kaizen, xanh dương, xanh lá, cam, tím, vàng, teal, hồng...) — đủ màu cho danh sách dài nhất (trạng thái có ~8 mục).
- Tooltip khi di chuột: tên nhóm + số lượng + tỷ lệ %.
- **Chú thích phía dưới biểu đồ**: mỗi dòng gồm chấm màu + tên nhóm + số lượng (và % nếu phù hợp), dạng lưới 1–2 cột tùy số mục, có cuộn khi dài.
- Nhãn nhóm dạng mã (vd "duc", "nhat-ban") hiển thị Title Case cho dễ đọc ("Duc" → "Đức" chỉ khi có sẵn map nhãn trong dữ liệu; nếu không giữ nguyên giá trị gốc).
- Responsive: biểu đồ co giãn theo chiều rộng thẻ, lưới 2 cột trên desktop, 1 cột trên mobile.
- Trạng thái loading giữ skeleton như hiện tại; khi không có dữ liệu hiện "Chưa có dữ liệu".

## Cập nhật hướng dẫn
- Bổ sung một dòng trong bài hướng dẫn `van-hanh-tong-quan` tại `src/lib/help/guides.ts`: các khối thống kê hiển thị dạng biểu đồ tròn kèm chú thích.

## Kiểm chứng
- Chạy typecheck + build.
- Mở `/admin/van-hanh` bằng trình duyệt: chụp màn hình xác nhận 4 biểu đồ tròn hiển thị đúng màu, chú thích đủ mục, không tràn layout, tooltip hoạt động.

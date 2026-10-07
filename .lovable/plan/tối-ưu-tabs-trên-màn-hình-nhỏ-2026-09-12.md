# Tối ưu tabs trên màn hình nhỏ

## Phạm vi
- Chuẩn hóa component tabs dùng chung để mọi thanh tab nhiều mục cuộn ngang mượt trên điện thoại.
- Giữ mỗi nhãn tab nguyên vẹn, không xuống dòng, không dính sát hoặc bị cắt chữ.
- Tự đưa tab đang chọn vào vùng nhìn thấy khi người dùng chuyển tab.
- Giữ màu đỏ active, viền, hover, focus và trạng thái vô hiệu hóa hiện có.
- Kiểm tra các trang có nhiều tab, ưu tiên hồ sơ học viên, quản lý lớp và CMS.

## Kỹ thuật
- Bổ sung vùng cuộn với `min-w-0`, khoảng cách ổn định, touch momentum, overscroll ngang và scrollbar gọn.
- Điều chỉnh kích thước nút theo mobile/desktop, giữ `shrink-0` và `whitespace-nowrap`.
- Thêm xử lý cuộn tab active bằng `scrollIntoView` theo chiều ngang, tôn trọng reduced-motion.
- Kiểm tra ở viewport điện thoại và chạy kiểm tra biên dịch sau khi sửa.

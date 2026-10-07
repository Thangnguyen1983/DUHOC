# Tách rõ Cổng học viên và Cổng giáo viên

## Vấn đề

Tài khoản giáo viên khi mở Cổng học viên (`/hoc-vien`) vẫn thấy nội dung của giáo viên: nhãn "Giáo viên" dưới tên cổng, thẻ "Vai trò: Giáo viên", lời chào "Khu vực dành cho Giáo viên Kaizen", mục "Phòng dạy (Giáo viên)" trong menu, và các mục học viên (Hồ sơ, Bài học, Điểm danh...) bị ẩn vì tài khoản không phải học viên.

## Cách xử lý

1. Cổng học viên chỉ hiển thị nội dung học viên
   - Bỏ nhãn/thẻ/lời chào dành cho giáo viên khỏi trang tổng quan và thanh bên của `/hoc-vien`.
   - Nhãn dưới tên cổng luôn là "Học viên".
   - Bỏ mục "Phòng dạy (Giáo viên)" khỏi menu; việc chuyển cổng đã có ở menu tài khoản phía dưới.

2. Tài khoản không phải học viên
   - Nếu tài khoản chỉ là giáo viên (không có hồ sơ học viên), `/hoc-vien` hiển thị một thông báo gọn: "Tài khoản này chưa có hồ sơ học viên", kèm nút mở Cổng giáo viên và nút Đăng xuất — thay vì hiện khung học viên rỗng.
   - Nếu tài khoản vừa là giáo viên vừa là học viên, cổng học viên hiển thị đầy đủ nội dung học viên như bình thường.

3. Menu chuyển cổng
   - Giữ nguyên quy tắc hiện tại: chỉ tài khoản có vai trò học viên (hoặc quản trị xem thử) mới thấy lựa chọn "Cổng học viên"; giáo viên thuần không còn thấy lối vào cổng học viên.

## Chi tiết kỹ thuật

- `src/routes/hoc-vien.tsx`: bỏ nhánh `isTeacher` khỏi `roleLabel`, điều kiện menu và mục `/giang-day`; đổi điều kiện chặn thành `!data?.isStudent` với màn hình hướng dẫn sang `/giang-day`.
- `src/routes/hoc-vien.index.tsx`: bỏ nhánh `p?.isTeacher` (lời chào, thẻ Vai trò).
- `src/components/portal/portal-switcher.tsx`: `canOpenStudent` chỉ dựa trên vai trò `student` (và chế độ xem thử của quản trị).
- Không đổi server function, quyền, dữ liệu hay định danh.

# Rà soát cổng giáo viên: còn thiếu so với thiết kế

## Đã có (đã kiểm tra trong mã nguồn)

- `/giang-day`: tổng quan lớp, buổi hôm nay, buổi chưa điểm danh
- `/giang-day/lop` và `/giang-day/lop/:id`: 3 tab Điểm danh / Điểm số / Báo cáo
- Bảng chiếu QR điểm danh ngay trong tab Điểm danh
- Nhập điểm, báo cáo chuyên cần + xuất Excel
- `/giang-day/lich`: lịch tuần, cảnh báo trùng phòng/trùng giáo viên, sinh buổi hàng loạt

## Chưa đạt thiết kế — sẽ bổ sung

### 1. Điểm danh đang không nạp dữ liệu đã lưu (lỗi nghiêm trọng)
Màn điểm danh của giáo viên luôn hiển thị mặc định "Có mặt" cho tất cả học viên vì dữ liệu điểm danh đã ghi của buổi học không được trả về cho giáo viên (chỉ học viên mới nhận dữ liệu của chính mình). Hậu quả: bấm "Lưu điểm danh thủ công" sẽ ghi đè toàn bộ, xoá kết quả học viên đã tự quét QR.

Khắc phục:
- Trả về toàn bộ bản ghi điểm danh của buổi cho giáo viên/giáo vụ; màn hình nạp đúng trạng thái hiện tại.
- Hiển thị nguồn ghi nhận (QR / giáo viên) và giờ check-in trên từng dòng.
- Chỉ lưu những dòng giáo viên thực sự thay đổi, không ghi đè hàng loạt; mọi thay đổi ghi vào nhật ký chỉnh sửa kèm lý do khi phủ quyết lượt QR.
- Đánh dấu `check_in_method = manual` cho các dòng do giáo viên ghi.

### 2. Giáo viên chưa tạo/sửa buổi học trong lớp
Hiện chỉ sinh hàng loạt ở trang lịch. Bổ sung ngay trong tab Điểm danh: thêm buổi lẻ (ngày, giờ, phòng, tiêu đề), sửa/xoá buổi chưa điểm danh.

### 3. Chưa xem được hồ sơ/học bạ học viên từ lớp
Thêm cột thao tác trong danh sách lớp mở học bạ tổng hợp (chuyên cần, điểm, lớp, chứng chỉ) ở chế độ chỉ đọc cho giáo viên, kèm mã học viên để đối chiếu khi điểm danh.

### 4. Chưa có ghi chú theo học viên
Thêm ô ghi chú nhanh cho từng học viên trong buổi (đi trễ có lý do, nghỉ có phép) và nhật ký ghi chú của giáo viên trên hồ sơ học viên.

### 5. Quyền truy cập còn hẹp
Điểm danh/nhập điểm hiện chỉ chấp nhận vai trò `teacher` và `admin`; `training_manager` (giáo vụ) bị chặn. Mở đúng theo RBAC hiện hành.

## Chi tiết kỹ thuật

- `src/lib/portal/portal.impl.ts`: `getMyClassDetailImpl` trả thêm `sessionAttendance` (theo `session_id`) cho nhánh giáo viên/giáo vụ; `markAttendanceImpl` nhận danh sách thay đổi, set `check_in_method`, `recorded_by`, ghi `attendance_change_log`, và bổ sung `training_manager` vào kiểm tra quyền.
- `src/routes/giang-day.lop.$id.tsx`: khởi tạo `marks` từ dữ liệu trả về, thêm cột nguồn/giờ check-in, ô ghi chú, khối tạo/sửa buổi học, nút mở học bạ.
- Buổi học: thêm server fn tạo/sửa/xoá buổi lẻ trong `src/lib/training/teaching.functions.ts` (thin wrapper) + `teaching.impl.ts`, chặn xoá buổi đã có điểm danh.
- Học bạ dùng lại `getStudentTranscript` + `src/components/training/student-transcript.tsx` ở chế độ chỉ đọc.

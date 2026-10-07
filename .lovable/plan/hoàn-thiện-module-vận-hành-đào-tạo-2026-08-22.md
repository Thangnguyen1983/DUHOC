# Hoàn thiện module Vận hành & Đào tạo

## Hiện trạng (đã kiểm tra)

Đã có:
- Chương trình đào tạo (CRUD), Lớp học (CRUD, gán giáo viên), Buổi học, Ghi danh học viên
- Điểm danh thủ công theo buổi (admin + cổng học viên/giáo viên), Nhập điểm & tính điểm tổng kết
- Chứng chỉ (tự động cấp khi đủ điều kiện), Cổng học viên `/hoc-vien` (lớp học, bài học, bài kiểm tra, chứng chỉ, thông báo)
- Vận hành: SLA quá hạn, hàng đợi cấp tài khoản Portal

Còn thiếu:
- Không có bất kỳ chức năng QR nào cho điểm danh
- Chưa có cổng giáo viên riêng (giáo viên đang dùng chung `/hoc-vien`, không tự tạo buổi học được)
- Chưa có trang học bạ tổng hợp của một học viên (lớp + chuyên cần + điểm + chứng chỉ)
- Chưa có báo cáo chuyên cần/điểm và xuất Excel
- Chưa có sinh buổi học tự động theo lịch, chưa có xem thời khoá biểu tuần/tháng

## Sẽ làm

### 1. Điểm danh bằng QR (học viên quét QR của buổi học)
- Giáo viên mở "Phiên điểm danh" cho một buổi → màn hình chiếu mã QR lớn, mã tự đổi mỗi 30 giây (chống chụp ảnh gửi nhau), có đếm ngược và danh sách người đã check-in cập nhật trực tiếp.
- Học viên vào `/hoc-vien` bấm "Điểm danh", quét QR bằng camera điện thoại → tự ghi nhận có mặt; quá giờ bắt đầu N phút thì ghi "Trễ" (cấu hình được).
- Chặn gian lận: mã có hạn ngắn + ký số theo phiên, chỉ học viên có ghi danh trong lớp mới check-in được, mỗi buổi chỉ ghi nhận 1 lần.
- Giáo viên vẫn sửa tay được sau đó (giữ nguyên màn điểm danh hiện tại), có nút "đóng phiên".

### 1b. Xác thực đúng đối tượng học viên khi điểm danh
Vấn đề hiện tại: điểm danh gắn với bản ghi ghi danh của hồ sơ học viên, nhưng tài khoản đăng nhập chỉ nối với hồ sơ qua `user_id`; nếu trống thì hệ thống dò theo email. Email sai, trùng hoặc hồ sơ chưa nối tài khoản đều có thể dẫn tới ghi nhận nhầm người.

Cách khắc phục:
- Bắt buộc "khoá định danh": mỗi hồ sơ học viên chỉ nối đúng 1 tài khoản (`user_id` duy nhất), và một tài khoản chỉ nối 1 hồ sơ. Việc dò theo email chỉ dùng một lần khi kích hoạt tài khoản, sau đó khoá lại và ghi nhật ký ai/khi nào nối.
- Check-in QR chỉ chấp nhận khi: tài khoản đã nối hồ sơ → hồ sơ có ghi danh đang hoạt động trong đúng lớp của buổi học đó. Không thoả thì báo lỗi rõ ràng thay vì ghi nhận.
- Mỗi lần check-in lưu bằng chứng: mã học viên, tài khoản thực hiện, thời điểm, phương thức (QR/thủ công), thiết bị và tuỳ chọn ảnh chụp/vị trí (nếu bật). Giáo viên thấy ngay tên + mã học viên + ảnh đại diện khi có người check-in để đối chiếu tại lớp.
- Bảng điểm danh của giáo viên hiển thị nguồn ghi nhận ("Học viên tự quét" / "Giáo viên ghi"), cho phép giáo viên phủ quyết và ghi lý do; mọi thay đổi lưu lịch sử.
- Nếu bật "cần giáo viên duyệt", các lượt tự quét vào trạng thái chờ cho tới khi giáo viên xác nhận đóng phiên.


### 2. Cổng giáo viên riêng (`/giang-day`)
- Trang tổng quan: lớp đang dạy, buổi học hôm nay, việc cần làm (buổi chưa điểm danh, điểm chưa nhập).
- Trong lớp: danh sách học viên, tạo/sửa buổi học, mở phiên QR, điểm danh, nhập điểm, ghi chú theo học viên.
- Giới hạn theo quyền: giáo viên chỉ thấy lớp mình phụ trách.

### 3. Hồ sơ & học bạ học viên — trung tâm dữ liệu của toàn hệ thống
Hiện hồ sơ học viên đã nối với: Lead tư vấn, tiến trình 18 bước, tài liệu hồ sơ, ghi danh lớp offline, điểm, chuyên cần, chứng chỉ. Chưa nối chặt với: tài khoản đăng nhập (chỉ dò theo email), khoá học online, đơn hàng/thanh toán, thông báo và lịch sử chăm sóc gộp chung.

Sẽ hoàn thiện:
- Mỗi học viên có một mã học viên duy nhất, dùng chung cho lớp offline, khoá học online, chứng chỉ và điểm danh QR.
- Nối hồ sơ ↔ tài khoản portal ↔ khoá học online ↔ đơn hàng, để mọi nơi cùng trỏ về một hồ sơ.
- Một trang học bạ tổng hợp: thông tin cá nhân, tiến trình hồ sơ, lớp đã/đang học, tỷ lệ chuyên cần, bảng điểm từng lớp, khoá online đã mua và tiến độ, chứng chỉ, đơn hàng, nhật ký chăm sóc.
- Truy cập từ danh sách học viên, danh sách lớp và từ màn điểm danh; học viên xem bản rút gọn của chính mình trong `/hoc-vien`.
- Trang quản trị "hồ sơ chưa nối tài khoản / nối trùng" để phát hiện và xử lý dữ liệu lệch.


### 4. Báo cáo & xuất Excel
- Báo cáo chuyên cần theo lớp/khoảng thời gian, báo cáo điểm, danh sách cảnh báo vắng vượt ngưỡng.
- Nút xuất Excel (.xlsx) cho: danh sách lớp, bảng điểm, bảng chuyên cần.

### 5. Lịch học & thời khoá biểu
- Sinh buổi học hàng loạt theo lịch lặp (thứ trong tuần + giờ + số buổi/ngày kết thúc).
- Xem lịch dạng tuần/tháng: theo toàn trung tâm (admin) và theo giáo viên; hiện phòng học, cảnh báo trùng phòng/trùng giáo viên.

## Chi tiết kỹ thuật

- CSDL: thêm bảng `attendance_sessions` (buổi, mã bí mật, thời gian mở/đóng, người mở) và các cột `check_in_method`, `check_in_at` cho `training_attendance`; thêm cột lịch lặp vào `training_classes.meta`. Mọi bảng mới có GRANT + RLS (giáo viên phụ trách và admin/training_manager ghi; học viên chỉ check-in qua server function).
- Mã QR: token ngắn hạn (HMAC + timestamp cửa sổ 30s) do server function tạo, không lưu trạng thái ở client; xác thực và ghi điểm danh trong server function có `requireSupabaseAuth`.
- Quét QR: thư viện đọc mã chạy trên trình duyệt, nạp động phía client (không SSR).
- Xuất Excel dùng thư viện chạy được trên Worker; sinh file trong server function rồi tải về.
- Định danh: thêm ràng buộc duy nhất `student_profiles.user_id`, cột mã học viên duy nhất, bảng nhật ký nối tài khoản; bỏ việc tự nối theo email ở mọi lần đọc, chỉ nối một lần khi kích hoạt.
- Điểm danh lưu thêm `check_in_method`, `recorded_by`, `device_info`, `verified_by`, và bảng lịch sử chỉnh sửa.
- Server logic đặt trong `src/lib/training/*.functions.ts` theo cấu trúc hiện có; quyền dùng lại RBAC (`training.manage`, vai trò `teacher`).

## Thứ tự triển khai

1. Khoá định danh hồ sơ ↔ tài khoản (nền tảng cho điểm danh chính xác)
2. Điểm danh QR (CSDL + màn hình chiếu QR + màn quét cho học viên)
3. Cổng giáo viên `/giang-day`
4. Lịch học & sinh buổi tự động
5. Học bạ học viên hợp nhất toàn hệ thống
6. Báo cáo & xuất Excel


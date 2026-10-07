# Lưu vết người chịu trách nhiệm hồ sơ học viên — từ đầu đến cuối

## Hiện trạng (đã kiểm tra trực tiếp trong dữ liệu)

Hệ thống **đã ghi một phần**, nhưng rời rạc và còn nhiều khoảng trống:

Đã có:
- Hồ sơ học viên: người tạo, người sửa cuối, người phụ trách.
- Lịch sử trạng thái, nhật ký các bước quy trình: có trường người thực hiện.
- Chăm sóc, giấy tờ, checklist (người duyệt/xác minh), điểm danh (người ghi/xác minh), chấm điểm, chứng chỉ (người cấp), kho lưu trữ giấy (người nhập/di chuyển), xuất hồ sơ 360° (người xuất).

Còn thiếu:
- 21/21 hồ sơ hiện tại **không có người tạo**; 17/21 không có người sửa cuối — hồ sơ sinh tự động từ lead và dữ liệu mẫu không gán ai.
- 83 dòng lịch sử trạng thái và 69 dòng nhật ký quy trình **không có người thực hiện** (do máy tự chuyển).
- Checklist chỉ lưu người duyệt lần cuối, không lưu ai đổi trạng thái từng lần.
- Ghi danh lớp, đăng ký tư vấn không lưu người thao tác.
- Không có màn hình nào xem được **toàn bộ chuỗi trách nhiệm đầu → cuối**: tab "Lịch sử" chỉ hiện đổi trạng thái và hiện mã người dùng thay vì tên.
- Chỉ có một người phụ trách chung, không ghi người chịu trách nhiệm theo từng giai đoạn (tư vấn → hồ sơ → đào tạo → visa → xuất cảnh → hậu xuất cảnh).

## Việc sẽ làm

### 1. Bịt các lỗ hổng ghi vết
- Bổ sung người thao tác cho: cập nhật checklist từng lần, ghi danh lớp học, tiếp nhận/chuyển lead, sửa thông tin nơi làm việc & hợp đồng, áp dụng kết quả quét giấy tờ.
- Khi hệ thống tự chạy (máy chuyển bước, cron cảnh báo hợp đồng): ghi rõ "Hệ thống — tự động" kèm lý do, thay vì để trống.
- Chuẩn hoá dữ liệu cũ đang trống thành "Hệ thống (dữ liệu trước khi bật lưu vết)" để không có dòng nào vô danh.

### 2. Sổ nhật ký trách nhiệm hợp nhất
- Một bảng nhật ký chung cho hồ sơ học viên, ghi: ai — làm gì — lúc nào — thay đổi từ giá trị nào sang giá trị nào — ghi chú.
- Mọi thao tác ở các module hiện có (hồ sơ, checklist, giấy tờ, workflow, lớp học, điểm danh, chứng chỉ, kho giấy, xuất hồ sơ) đều ghi thêm một dòng vào sổ này. Không tạo bảng học viên mới, không tạo hệ mã mới, không thay đổi nghiệp vụ hiện có.

### 3. Màn hình "Nhật ký & trách nhiệm" trong hồ sơ học viên
- Thay tab "Lịch sử" hiện tại bằng dòng thời gian đầy đủ: gộp nhật ký chung + đổi trạng thái + các bước quy trình, hiển thị **tên và vai trò người xử lý** (không hiện mã kỹ thuật), lọc theo người, theo loại việc, theo khoảng thời gian.
- Khối "Người chịu trách nhiệm theo giai đoạn" ở đầu trang: mỗi giai đoạn hiện người phụ trách, thời điểm bắt đầu/kết thúc, ai bàn giao cho ai.

### 4. Bàn giao có dấu vết
- Nút "Chuyển người phụ trách": chọn người nhận, lý do; ghi lại người bàn giao — người nhận — thời điểm, gửi thông báo cho người nhận.

### 5. Xuất & tra soát
- Xuất hồ sơ 360° bổ sung mục "Nhật ký trách nhiệm" đầy đủ theo thứ tự thời gian.
- Trang tra soát cho quản lý: lọc nhật ký toàn hệ thống theo nhân sự, giai đoạn, khoảng thời gian.

### 6. Hướng dẫn sử dụng
- Bổ sung bài hướng dẫn "Nhật ký & trách nhiệm hồ sơ học viên" trong /admin/huong-dan.

## Chi tiết kỹ thuật

- Bảng mới `student_activity_logs` (student_profile_id, actor_id, actor_email, actor_roles, action, entity, entity_id, field, old_value, new_value, note, source: user|system, created_at) kèm GRANT + RLS: nhân sự có quyền `students.view` được đọc, chỉ ghi qua server function; học viên không đọc.
- Helper `logStudentActivity()` trong `src/lib/students/activity.server.ts`, gọi từ các server function hiện có (`students.functions.ts`, `checklist.functions.ts`, `archive.functions.ts`, `workflow.functions.ts`, `training/*`, `export360`), không sinh luồng song song.
- Bàn giao dùng lại `student_profiles.assigned_to` + ghi `student_status_history`/nhật ký, không thêm bảng phân công mới.
- Backfill dữ liệu trống bằng migration cập nhật nhãn "system", không đụng nghiệp vụ.
- Timeline dùng `useRealtimeRefresh` đã có để cập nhật tức thời.

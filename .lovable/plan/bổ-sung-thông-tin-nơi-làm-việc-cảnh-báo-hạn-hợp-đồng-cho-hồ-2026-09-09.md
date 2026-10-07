# Bổ sung thông tin nơi làm việc & cảnh báo hạn hợp đồng cho hồ sơ học viên

## Mục tiêu
Hồ sơ học viên có thêm khối "Nơi đến học tập / làm việc": nước đến, ngành nghề, địa chỉ nơi làm việc, người liên hệ, thời hạn làm việc, kèm cảnh báo khi hợp đồng sắp hết hạn.

## Kiểm tra trùng lặp (đã rà soát)
- Hồ sơ học viên hiện có: định danh, OCR, trạng thái hồ sơ/visa/xuất cảnh/hợp đồng, thị trường (`country`), chương trình. **Chưa có** bất kỳ trường nào về nơi làm việc, ngành nghề, chủ sử dụng lao động hay ngày hết hạn hợp đồng.
- Không tạo bảng học viên mới, không tạo hệ mã định danh mới. Mọi thông tin lưu trực tiếp trên hồ sơ học viên hiện có (1 nơi làm việc hiện tại).
- Không tạo module thông báo mới — dùng đúng hệ thống thông báo đang chạy.

## Nội dung sẽ làm

### 1. Bổ sung trường vào hồ sơ học viên
Khối mới "Nơi đến học tập & làm việc":
- Nước đến, thành phố/tỉnh đến
- Ngành nghề, vị trí công việc
- Tên đơn vị tiếp nhận (trường / công ty)
- Địa chỉ nơi làm việc
- Người liên hệ: họ tên, điện thoại, email
- Ngày bắt đầu hợp đồng, ngày kết thúc hợp đồng, thời hạn (tháng)
- Ngày xuất cảnh thực tế, ghi chú gia hạn

Quyền xem/sửa khối này: **quản trị, cán bộ xuất cảnh, CSKH** (các vai trò khác vẫn xem được phần còn lại của hồ sơ như hiện nay).

### 2. Giao diện
- Trang chi tiết học viên: thẻ "Nơi đến học tập & làm việc" với nút Sửa, hiển thị đủ các mục trên. Thời hạn còn lại hiển thị dạng nhãn màu: còn >90 ngày (xanh), ≤90 ngày (vàng), ≤30 ngày (cam), ≤7 ngày hoặc đã quá hạn (đỏ).
- Danh sách học viên: thêm cột "Hạn hợp đồng" + bộ lọc nhanh "Sắp hết hạn 90/30/7 ngày" và "Đã quá hạn".
- Trang tổng quan quản trị: thẻ đếm số hồ sơ sắp hết hạn hợp đồng, bấm vào mở danh sách đã lọc.

### 3. Cảnh báo tự động
- Mốc 90 / 30 / 7 ngày trước ngày kết thúc hợp đồng.
- Mỗi mốc gửi **một** thông báo cho cán bộ phụ trách hồ sơ (và quản trị nếu hồ sơ chưa có người phụ trách), không gửi lặp lại.
- Chạy một lần mỗi ngày (tác vụ định kỳ theo thời gian, mỗi ngày 1 lần — mức tối thiểu cần thiết, gần như không phát sinh chi phí vận hành thêm; sai số tối đa 24 giờ so với mốc).
- Nhãn cảnh báo trên giao diện được tính trực tiếp từ ngày kết thúc nên luôn chính xác theo thời gian thực, không phụ thuộc tác vụ nền.

### 4. Kết nối các phần đang có
- Đưa khối thông tin này vào bản **Xuất hồ sơ 360°** (PDF, Excel, ZIP) thành một mục riêng.
- Tìm kiếm học viên theo tên đơn vị tiếp nhận và ngành nghề.

### 5. Hướng dẫn sử dụng
Thêm bài hướng dẫn trong `/admin/huong-dan`: cách nhập thông tin nơi làm việc, ý nghĩa các mốc cảnh báo, ai được xem, xử lý khi hợp đồng sắp hết hạn.

## Chi tiết kỹ thuật
- Migration thêm cột vào `public.student_profiles`: `destination_country`, `destination_city`, `occupation`, `job_title`, `employer_name`, `work_address`, `employer_contact_name`, `employer_contact_phone`, `employer_contact_email`, `contract_start_date`, `contract_end_date`, `contract_duration_months`, `contract_renewal_note`, `departure_date`; index trên `contract_end_date`. Giữ nguyên GRANT/RLS hiện có của bảng (không thêm bảng mới).
- Cột `contract_alert_sent` (jsonb) ghi nhận mốc đã gửi để chống trùng thông báo.
- Đọc/ghi qua `src/lib/students.functions.ts` (mở rộng `getStudent`/`updateStudent`, thêm `updatePlacement` có kiểm tra vai trò `admin` / `departure_coordinator` / `cskh`); validate số điện thoại, email, và `contract_end_date >= contract_start_date` ở phía server.
- Cảnh báo: hàm SQL quét hồ sơ tới mốc rồi ghi vào `public.notifications`, lịch chạy hằng ngày qua `pg_cron`.
- Xuất 360°: bổ sung mục vào `src/lib/students/export360.server.ts` (PDF + sheet Excel).
- Hướng dẫn: `src/lib/help/guides.ts`.

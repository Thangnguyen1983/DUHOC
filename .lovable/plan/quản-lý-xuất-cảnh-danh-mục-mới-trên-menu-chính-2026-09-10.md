# Quản lý xuất cảnh (danh mục mới trên menu chính)

Module mới quản lý người lao động / học viên xuất cảnh, đủ 21 trường như file mẫu, kèm bảng thống kê và nhập/xuất Excel đúng mẫu.

## Rà soát trùng lặp (đã kiểm tra)

- Chưa có module xuất cảnh nào; menu hiện chỉ có "Thống kê visa" (`/admin/visa`, thống kê tỷ lệ visa) và "Hồ sơ học viên".
- `student_profiles` đã có sẵn: mã học viên, họ tên, giới tính, ngày sinh, CCCD + ngày cấp, nơi thường trú/quê quán, điện thoại, nước đến, ngành nghề, nơi làm việc, ngày xuất cảnh, trạng thái xuất cảnh.
- Kết luận: không tạo bảng học viên mới, không tạo hệ mã mới. Danh sách xuất cảnh là bảng riêng liên kết `student_profile_id`, tự kéo dữ liệu sang khi chọn học viên, và cho phép nhập người ngoài hệ thống.

## Chức năng

### 1. Danh sách xuất cảnh `/admin/xuat-canh`
- Bảng danh sách: mã, họ tên, giới tính, ngày sinh, số CCCD, hộ chiếu, nước đến, đơn hàng/ngành nghề, ngày xuất cảnh, chuyến bay, trạng thái.
- Bộ lọc: trạng thái (dự kiến / đã xuất cảnh / hoãn / huỷ), nước đến, khoảng thời gian xuất cảnh, đợt xuất cảnh, tìm theo tên/CCCD/hộ chiếu/mã.
- Thao tác: thêm, sửa, xoá, đánh dấu đã xuất cảnh, chọn nhiều dòng để xuất Excel.

### 2. Thêm người lao động
- Nút "Lấy từ hồ sơ học viên": chọn học viên (tìm theo mã/tên/điện thoại), hệ thống tự điền các trường đã có; chỉ cần bổ sung phần còn thiếu.
- Hoặc nhập tay hoàn toàn cho người ngoài hệ thống.
- Form chia nhóm: Giấy tờ tuỳ thân · Nhân thân · Địa chỉ · Chính sách ưu tiên · Thông tin xuất cảnh.

### 3. Trường dữ liệu (đủ theo file mẫu)
Số căn cước*, ngày cấp căn cước, số hộ chiếu, ngày cấp hộ chiếu, họ và tên*, giới tính*, ngày sinh*, hôn nhân, nơi sinh*, số điện thoại*, nơi ở hiện tại*, tỉnh/thành phố*, phường/xã*, dân tộc, tôn giáo, trình độ chuyên môn, đã từng làm việc ở nước ngoài, mất đất, hộ nghèo/cận nghèo, bộ đội xuất ngũ, dân tộc thiểu số.

Bổ sung phục vụ quản lý: nước đến, đợt xuất cảnh, ngày xuất cảnh dự kiến, ngày xuất cảnh thực tế, số hiệu chuyến bay, sân bay đi/đến, đơn vị tiếp nhận, trạng thái, ghi chú.

### 4. Nhập từ file Excel mẫu
- Tải file `.xls/.xlsx` theo đúng mẫu, xem trước bảng, báo lỗi từng dòng (thiếu trường bắt buộc, sai định dạng ngày, trùng số căn cước).
- Chọn dòng hợp lệ để nhập; dòng trùng số căn cước có thể cập nhật thay vì tạo mới.

### 5. Xuất file đúng mẫu
- Xuất Excel đúng 21 cột, đúng thứ tự và mã quy ước của mẫu (giới tính 1/0, hôn nhân 1/0, Y/N cho các mục chính sách, ngày dạng dd-mm-yyyy) để nộp cơ quan.
- Xuất theo bộ lọc đang xem hoặc theo các dòng đã chọn.

### 6. Bảng thống kê
- Thẻ số liệu: tổng người đã xuất cảnh, dự kiến trong 30 ngày tới, trong tháng, trong năm, số bị hoãn/huỷ.
- Biểu đồ tròn: theo nước đến, theo giới tính, theo trạng thái, theo nguồn (học viên nội bộ / nhập ngoài).
- Biểu đồ cột: số lượt xuất cảnh theo tháng (12 tháng gần nhất).
- Bảng: các đợt xuất cảnh sắp tới và danh sách người đi kèm.

### 7. Kết nối module khác
- Kéo dữ liệu từ hồ sơ học viên khi chọn; sau khi đánh dấu "đã xuất cảnh" sẽ cập nhật ngày xuất cảnh và trạng thái tương ứng trên hồ sơ học viên, ghi vào nhật ký trách nhiệm hiện có.
- Số liệu xuất cảnh hiển thị thêm ở trang Tổng quan vận hành và Dashboard.

## Chi tiết kỹ thuật

- Bảng mới `departure_records` (liên kết tuỳ chọn `student_profile_id`), `departure_batches` (đợt xuất cảnh); GRANT + RLS: nhân sự có quyền xem/sửa xuất cảnh, không mở cho `anon`; trigger `updated_at`; unique theo số căn cước khi chưa xoá; bật realtime.
- Server functions trong `src/lib/departure/`: danh sách + lọc, tạo/sửa/xoá, prefill từ `student_profiles`, thống kê tổng hợp, nhập hàng loạt, xuất Excel (dùng lại bộ ghi XLSX sẵn có `xlsx-report.server.ts`).
- Đọc file Excel tải lên bằng thư viện đọc xlsx phía máy chủ; file `.xls` cũ sẽ hướng dẫn lưu lại thành `.xlsx` nếu thư viện không đọc được.
- Phân quyền: thêm `departure.view` / `departure.edit`, gán cho admin, điều phối xuất cảnh, cán bộ visa, vận hành; map route theo tiền tố dài nhất; hiện mục menu chính "Quản lý xuất cảnh".
- Ghi nhật ký hoạt động qua `students/activity.server.ts` khi thay đổi trạng thái xuất cảnh của học viên.
- Cập nhật hướng dẫn sử dụng trong `src/lib/help/guides.ts` cho module mới.

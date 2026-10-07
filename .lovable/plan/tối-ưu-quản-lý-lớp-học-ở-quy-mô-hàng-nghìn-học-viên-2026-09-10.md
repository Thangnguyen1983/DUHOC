# Tối ưu quản lý lớp học ở quy mô hàng nghìn học viên

## Hiện trạng (đã rà soát trong mã nguồn)

- `/admin/training/classes`: hiển thị **tất cả lớp dưới dạng thẻ**, không có lọc, không tìm kiếm, không phân trang → quá tải khi có hàng trăm lớp.
- `/admin/training/oversight`: có bảng, lọc theo giáo viên / chương trình / trạng thái, xuất Excel — nhưng **không lọc theo thị trường, theo khoá, theo loại chương trình**, và tải toàn bộ dữ liệu một lần.
- Dữ liệu đã có sẵn: chương trình đào tạo có **thị trường, ngôn ngữ, cấp độ**; lớp có mã, tên, giáo viên, ngày bắt đầu/kết thúc, phòng, sĩ số, trạng thái.
- **Còn thiếu:** khái niệm **khoá tuyển sinh (đợt/kỳ)** và **loại chương trình (tiếng / nghề / định hướng / kỹ năng)** — hiện chỉ ngầm hiểu qua tên lớp.
- Không có màn hình tổng quan riêng cho đào tạo theo thị trường/khoá; số liệu nằm rải ở `/admin/van-hanh` và `/admin/training/analytics`.

## Đề xuất

Giữ nguyên bảng lớp/ghi danh hiện có, **không tạo bảng học viên hay hệ mã mới**. Bổ sung ba lớp thông tin phân loại + làm lại màn hình quản lý lớp theo hướng bảng + bộ lọc + phân trang server.

### 1. Bổ sung phân loại còn thiếu
- Chương trình đào tạo thêm **loại chương trình**: Tiếng / Nghề / Định hướng / Kỹ năng mềm / Khác (mặc định suy ra từ dữ liệu hiện tại, sửa được trong danh mục).
- Lớp học thêm **khoá tuyển sinh** (ví dụ `2026-A`, `Khoá 12`) và **thị trường** (mặc định lấy theo chương trình, cho phép ghi đè), lấy từ danh mục thị trường đã có.
- Tự động điền cho dữ liệu cũ: thị trường theo chương trình, khoá suy ra từ tháng bắt đầu.

### 2. Màn hình Lớp học làm lại
- Chuyển từ lưới thẻ sang **bảng gọn**: mã lớp, tên, chương trình + loại, thị trường, khoá, giáo viên, sĩ số/tối đa, tiến độ buổi học, chuyên cần, trạng thái.
- **Bộ lọc dính (nhớ lựa chọn)**: thị trường, khoá, loại chương trình, chương trình, cấp độ, giáo viên, trạng thái, khoảng ngày khai giảng + ô tìm kiếm.
- **Phân trang phía máy chủ** (50 dòng/trang) và đếm tổng — không tải toàn bộ lớp về trình duyệt nữa.
- Nhóm gộp tuỳ chọn: xem theo **thị trường**, theo **khoá**, hoặc theo **loại chương trình**, mỗi nhóm có dòng tổng (số lớp, số học viên, sĩ số trống).
- Thao tác hàng loạt: đổi trạng thái, gán giáo viên, xuất Excel cho đúng tập đang lọc.

### 3. Bảng điều khiển tổng quan đào tạo
Khối đầu trang Lớp học (và tái sử dụng cho `/admin/van-hanh`):
- Thẻ số: lớp đang học, lớp sắp khai giảng 30 ngày tới, tổng học viên đang học, chỗ trống còn lại, lớp chưa có giáo viên, lớp chuyên cần thấp.
- Ba biểu đồ tròn: học viên theo **thị trường**, theo **loại chương trình**, theo **khoá**.
- Danh sách cảnh báo: lớp quá tải, lớp thiếu học viên, lớp chưa điểm danh, lớp sắp kết thúc chưa có điểm.

### 4. Quản lý học viên trong lớp (quy mô lớn)
- Danh sách ghi danh trong từng lớp: tìm kiếm theo tên/mã học viên/điện thoại, lọc theo trạng thái ghi danh, phân trang, chọn nhiều để chuyển lớp / đổi trạng thái / xuất danh sách.
- Ghi danh hàng loạt: chọn nhiều học viên từ kho hồ sơ theo bộ lọc thị trường/chương trình thay vì thêm từng người.

## Chi tiết kỹ thuật
- Migration: thêm `training_programs.program_type`, `training_classes.cohort`, `training_classes.market` (đều cho phép trống), chỉ số cho các cột lọc và `training_enrollments(class_id, status)`; backfill dữ liệu cũ. Giữ nguyên RLS/GRANT hiện hành.
- Mở rộng `listClasses` trong `src/lib/training/training.functions.ts` thành truy vấn có lọc + phân trang + tổng hợp; thêm `getClassesOverview` dùng lại cách tính của `oversight.impl.ts`, không viết lại logic chuyên cần/điểm.
- Trang `/admin/training/classes` dùng bảng + bộ lọc; `/admin/training/oversight` dùng chung bộ lọc để tránh hai luồng khác nhau.
- RBAC: dùng lại `training.view` / `training.edit` hiện có, không thêm quyền mới.
- Cập nhật hướng dẫn sử dụng trong `src/lib/help/guides.ts`.
- Kiểm thử: typecheck, build, unit test bộ lọc, và kiểm tra thực tế trên màn hình lớn/điện thoại.

## Thứ tự thực hiện
1. Migration phân loại + backfill.
2. Truy vấn có lọc/phân trang + tổng quan.
3. Màn hình Lớp học mới (bảng, lọc, nhóm, xuất Excel).
4. Khối tổng quan + cảnh báo.
5. Danh sách học viên trong lớp quy mô lớn + ghi danh hàng loạt.

# Trung tâm báo cáo toàn hệ thống

## Kết quả rà soát hiện trạng (đã kiểm tra trong mã nguồn)

Đang có sẵn:
- Tổng quan vận hành (`/admin/van-hanh`): 6 biểu đồ có "Xem chi tiết", tải CSV tóm tắt và tải Excel báo cáo (Tổng hợp + Chi tiết).
- Hồ sơ 360° từng học viên: xuất PDF / Excel / ZIP, có checksum và nhật ký.
- Danh sách học viên: tải CSV theo bộ lọc.
- Xuất cảnh: nhập/xuất Excel đúng 21 cột theo mẫu + tải file mẫu trắng.
- Giám sát lớp học: xuất Excel danh sách lớp.
- Chứng chỉ: tải PDF từng chứng chỉ.
- Hướng dẫn sử dụng: có chức năng in riêng phần nội dung.

Chưa có báo cáo/tải về/in:
- Khách hàng tiềm năng (lead) và hiệu quả nguồn/chiến dịch marketing.
- Đơn hàng khoá học và doanh thu.
- Điểm danh và bảng điểm theo lớp.
- Phân tích đào tạo (`/admin/training/analytics`).
- Visa, lưu trữ hồ sơ vật lý, tra soát (nhật ký trách nhiệm).
- Không có nơi tập trung để chọn kỳ báo cáo, xem chi tiết rồi tải/in.
- Chưa có bản in (print) chuẩn cho bất kỳ báo cáo dạng bảng nào.

## Đề xuất

Xây dựng một trang duy nhất **Báo cáo** (`/admin/bao-cao`), dùng lại đúng bộ máy báo cáo đang chạy ở `/admin/van-hanh` (không tạo bảng mới, không tạo luồng song song), mở rộng thêm các loại báo cáo còn thiếu và bổ sung chức năng in.

### Nội dung trang Báo cáo
- Chọn loại báo cáo (nhóm: Học viên & hồ sơ, Tuyển sinh & marketing, Đào tạo, Tài chính, Xuất cảnh, Lưu trữ & tra soát).
- Bộ lọc chung: khoảng thời gian, thị trường, lớp/khoá, trạng thái.
- Khối tóm tắt (số liệu + biểu đồ) và bảng chi tiết dữ liệu thật, có phân trang và tìm kiếm.
- Ba nút hành động cho mọi báo cáo: **Tải Excel** (Tổng hợp + Chi tiết, có nhận diện thương hiệu), **Tải CSV**, **In / Lưu PDF** (bản in sạch chỉ gồm tiêu đề, kỳ báo cáo, bảng số liệu, người xuất, thời điểm xuất).

### Các báo cáo bổ sung
1. Lead theo trạng thái / nguồn / UTM / nhân viên tiếp nhận và tỉ lệ chuyển đổi.
2. Doanh thu khoá học theo đơn hàng, khoá học, thời gian.
3. Điểm danh theo lớp/học viên (tỉ lệ có mặt, đi muộn, vắng).
4. Bảng điểm và kết quả cuối khoá theo lớp.
5. Visa theo trạng thái và thời gian xử lý.
6. Xuất cảnh theo đợt và thời điểm xuất cảnh.
7. Lưu trữ hồ sơ vật lý (đang mượn, quá hạn trả).
8. Tra soát: nhật ký người xử lý theo hồ sơ / nhân sự / khoảng thời gian.

### Bổ sung tại chỗ
Thêm nút Tải Excel + In ngay trên các trang: Lead, Đơn hàng khoá học, Điểm danh lớp, Bảng điểm lớp, Phân tích đào tạo, Visa, Lưu trữ, Tra soát — dùng chung đúng một hàm xuất, không viết lại.

## Chi tiết kỹ thuật
- Mở rộng `ChartDimension` hiện có thành danh mục `ReportKey` trong `src/lib/operations/overview.functions.ts`, giữ nguyên 6 loại cũ để `/admin/van-hanh` không đổi hành vi.
- Thêm tham số lọc (from/to, market, class, status) vào `getOperationsChartDetail` / `exportOperationsChartReport` dưới dạng tuỳ chọn.
- Dùng lại `src/lib/operations/report.server.ts` (`buildChartReportWorkbook`) cho tất cả báo cáo mới.
- Thêm component in dùng chung `src/components/reports/print-view.tsx` + CSS `no-print` như trang Hướng dẫn đang dùng.
- RBAC: thêm quyền `report.view` / `report.export`, gán cho các vai trò quản lý, ánh xạ route `/admin/bao-cao`, thêm mục menu; các báo cáo nhạy cảm (doanh thu, tra soát) chỉ hiện với vai trò tương ứng.
- Cập nhật hướng dẫn sử dụng trong `src/lib/help/guides.ts`.
- Kiểm thử: typecheck, build, unit test bộ lọc/tóm tắt, và kiểm tra thực tế tải Excel + xem bản in.

## Thứ tự thực hiện
1. Khung trang Báo cáo + bộ lọc + in + 6 báo cáo sẵn có.
2. Nhóm Học viên, Đào tạo (điểm danh, bảng điểm, phân tích), Visa.
3. Nhóm Tuyển sinh/marketing và Doanh thu.
4. Xuất cảnh, Lưu trữ, Tra soát + gắn nút tải/in tại chỗ trên từng trang.

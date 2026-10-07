# Xem chi tiết biểu đồ: báo cáo Excel dữ liệu thực

Hiện tại nút "Xem chi tiết" trên trang Vận hành & Đào tạo chỉ hiển thị bảng số đếm và tải CSV gồm 3 cột (hạng mục, số lượng, tỷ lệ). Nâng cấp thành báo cáo Excel đầy đủ danh sách thực tế đứng sau từng con số.

## Người dùng sẽ thấy gì

- Bấm **Xem chi tiết** trên mỗi biểu đồ: ngoài bảng tổng hợp, có thêm danh sách chi tiết từng học viên/hồ sơ/lớp thuộc nhóm được chọn (lọc theo hạng mục ngay trong hộp thoại).
- Nút **Tải báo cáo Excel** tạo file .xlsx theo màu nhận diện Kaizen, gồm:
  - Sheet "Tổng hợp": tiêu đề báo cáo, thời điểm xuất, người xuất, bảng hạng mục – số lượng – tỷ lệ – tổng.
  - Sheet "Chi tiết": toàn bộ dòng dữ liệu thực (mã học viên, họ tên, trạng thái, chương trình, thị trường/nước đến, tư vấn viên phụ trách, ngày tạo, hạn hợp đồng…), có lọc, khoá dòng tiêu đề, kẻ khung, tô xen kẽ.
- Giữ nút tải CSV nhanh như hiện tại.

## Nội dung chi tiết theo từng biểu đồ

- Học viên theo trạng thái / Hồ sơ visa / Chương trình / Thị trường: danh sách học viên (mã, họ tên, SĐT, trạng thái, trạng thái visa, chương trình, thị trường, nước đến, ngày tạo).
- Hồ sơ còn thiếu theo giai đoạn: danh sách mục checklist (học viên, mã, tên tài liệu, giai đoạn, bắt buộc, trạng thái, hạn nộp, số ngày quá hạn).
- Workflow đang chạy theo bước: danh sách hồ sơ (học viên, mã, bước hiện tại, trạng thái, ngày bắt đầu/cập nhật).

## Kỹ thuật

- Thêm server function `getOperationsDetail` trong `src/lib/operations/overview.functions.ts` (dùng lại `requireSupabaseAuth` + kiểm tra vai trò ALLOWED sẵn có), nhận `dataset: "students" | "documents" | "workflow"` và trả về mảng dòng đã chuẩn hoá nhãn tiếng Việt. Không tạo bảng mới, không tạo hệ mã mới — đọc từ `student_profiles`, `student_document_checklist`, `workflow_instances`.
- Thêm `src/lib/operations/report.server.ts` dựng workbook bằng `buildStyledWorkbook` đã có trong `src/lib/students/xlsx-report.server.ts` (tái sử dụng, không viết bộ dựng Excel mới), và server function `exportOperationsChartReport` trả về base64 .xlsx.
- `DonutPanel` trong `src/routes/_authenticated/admin.van-hanh.tsx`: nhận thêm `dataset` + `dimension`, lazy tải chi tiết khi mở hộp thoại, bảng chi tiết cuộn, nút tải Excel gọi server function.
- Ghi log hoạt động xuất báo cáo theo cơ chế `student_activity_logs` hiện có (nguồn: `operations_report`).
- Cập nhật `src/lib/help/guides.ts` phần Vận hành & Đào tạo.
- Kiểm tra: typecheck, unit test, build, và mở thử `/admin/van-hanh` xác nhận tải được file.

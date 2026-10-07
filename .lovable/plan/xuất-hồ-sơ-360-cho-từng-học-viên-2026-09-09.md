# Xuất hồ sơ 360° cho từng học viên

Thêm chức năng xuất trọn bộ hồ sơ một học viên ra file chuẩn lưu trữ và phục vụ thanh tra, ngay trên trang chi tiết học viên.

## Người dùng thấy gì

Trên trang chi tiết học viên (`/admin/students/{id}`), cạnh mã học viên có nút **Xuất hồ sơ 360°** mở hộp thoại:

- Chọn định dạng: **PDF (bản in)**, **Excel (nhiều sheet)**, hoặc **Gói ZIP** (PDF + Excel + toàn bộ ảnh giấy tờ, chứng chỉ đã tải lên).
- Chọn mục đích xuất (lưu trữ nội bộ / thanh tra / bàn giao) và ghi chú lý do — bắt buộc, để lưu nhật ký.
- Nhấn **Xuất file** → tải về ngay, tên file chuẩn: `KZ26xxxxxx_HoTen_360_20260909.pdf`.

Chỉ quản trị viên và cán bộ hồ sơ được thấy nút này. Mỗi lần xuất đều ghi nhật ký (ai xuất, lúc nào, định dạng, lý do) và hiển thị lịch sử xuất ngay dưới nút.

## Nội dung hồ sơ 360°

Gom đủ dữ liệu đang có trong hệ thống, mỗi phần một mục (PDF) / một sheet (Excel):

1. Thông tin định danh: mã học viên, họ tên, ngày sinh, giới tính, quốc tịch, giấy tờ tuỳ thân (loại, số, nơi cấp, hạn), quê quán, nơi ở, liên hệ, thời điểm quét OCR
2. Nguồn khách hàng: phiếu tư vấn gốc, chiến dịch/UTM, nhân viên phụ trách
3. Tiến trình trạng thái: toàn bộ lịch sử chuyển trạng thái + nhật ký các bước quy trình
4. Giấy tờ hồ sơ: danh mục checklist, tình trạng, người duyệt, thời điểm duyệt
5. Đào tạo: lớp đã ghi danh, lịch học, điểm danh (tỷ lệ chuyên cần), điểm số, kết quả
6. Chứng chỉ đã cấp (số hiệu, mã tra cứu, ngày cấp)
7. Chăm sóc & kỷ luật: nhật ký chăm sóc, ghi nhận kỷ luật, đánh giá
8. Trang cuối: chữ ký xác nhận, dấu thời gian xuất, mã kiểm tra tính toàn vẹn của file

## Chuẩn hoá dữ liệu & thanh tra

- Ngày tháng dd/MM/yyyy, tiền tệ và số liệu định dạng thống nhất, giá trị trống ghi rõ "—" thay vì để trắng.
- Mọi trang PDF có đầu trang (logo, tên công ty, mã học viên) và chân trang (số trang / tổng số trang, thời điểm xuất, người xuất).
- Sinh mã băm (checksum) của nội dung, in ở trang cuối và lưu vào nhật ký để đối chiếu khi thanh tra.
- Ảnh giấy tờ trong gói ZIP đặt tên theo `loai-giay-to_ngay-duyet.jpg`, kèm file `MUC-LUC.txt` liệt kê đủ.

## Chi tiết kỹ thuật

- Migration mới: bảng `public.student_export_logs` (student_profile_id, exported_by, format, purpose, note, checksum, file_name, created_at) + GRANT + RLS: nhân sự có quyền xem/ghi theo `has_role`, service_role toàn quyền.
- `src/lib/students/export360.server.ts`: gom dữ liệu qua `supabaseAdmin` sau khi đã xác thực quyền; dựng PDF bằng `pdf-lib` (nạp động như `certificate-pdf.server.ts`, dùng font Be Vietnam Pro để hiện dấu tiếng Việt), Excel bằng `xlsx` đã có sẵn, ZIP bằng `fflate` (thuần JS, chạy được trên Worker).
- `src/lib/students/export360.functions.ts`: `getExportHistory` + `logExport`; kiểm quyền bằng `has_role` (admin, editor hồ sơ, visa_officer, departure_coordinator).
- Tải file dùng server route `src/routes/api/students-export-360.ts` (POST, xác thực bearer token Supabase trong handler) để trả `Response` nhị phân đúng chuẩn tải xuống; route ghi nhật ký trước khi trả file.
- Giao diện: `src/components/students/export-360-dialog.tsx`, gắn vào `src/routes/_authenticated/admin.students.$id.tsx`.
- Không tạo bảng học viên mới, không tạo hệ mã định danh mới — dùng `student_code` sẵn có.

## Rà soát trùng lặp

- `exportStudentsCsv` hiện có chỉ xuất danh sách nhiều học viên dạng CSV (dữ liệu tóm tắt) — giữ nguyên, không trùng với hồ sơ 360° của một học viên.
- Xuất chứng chỉ PDF hiện có phục vụ mục đích khác — hồ sơ 360° chỉ nhúng thông tin chứng chỉ, không thay thế.
- Bổ sung bài hướng dẫn "Xuất hồ sơ 360° học viên" trong `/admin/huong-dan` theo quy trình module mới.

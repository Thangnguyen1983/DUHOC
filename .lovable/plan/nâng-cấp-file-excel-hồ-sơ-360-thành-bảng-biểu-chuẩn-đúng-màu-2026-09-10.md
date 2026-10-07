# Nâng cấp file Excel hồ sơ 360° thành bảng biểu chuẩn, đúng màu thương hiệu

File Excel hiện tại chỉ là các ô chữ thô, không có tiêu đề, viền, màu hay bảng lọc. Sẽ dựng lại thành bộ hồ sơ Excel trình bày chuẩn theo màu nhận diện Kaizen (đỏ #C92026, xanh #3F7D3A).

## Người dùng thấy gì

Mở file Excel xuất ra sẽ thấy:

- **Trang bìa "Thông tin xuất"**: khối tiêu đề đỏ trắng "HỒ SƠ HỌC VIÊN 360°", bên dưới là bảng hai cột (nhãn nền xám nhạt, chữ đậm – giá trị) gồm mã học viên, họ tên, mục đích, lý do, người xuất, thời điểm xuất, và mục lục liệt kê tên các sheet.
- **Mỗi phần hồ sơ là một sheet riêng** với cùng một khuôn: dòng 1 là tên phần trên nền đỏ thương hiệu, chữ trắng, gộp ô hết chiều rộng bảng; dòng 2 là dòng phụ (mã học viên – họ tên); dòng tiêu đề cột nền xanh đậm chữ trắng, in đậm, canh giữa; các dòng dữ liệu kẻ viền mảnh, tô sọc xen kẽ nhạt để dễ dò.
- Tiêu đề cột được **đóng băng** (cuộn xuống vẫn thấy) và có **nút lọc** trên từng cột.
- Độ rộng cột tự tính theo nội dung, ô chữ dài xuống dòng trong ô; ngày tháng dd/MM/yyyy, ô trống ghi "—".
- Chân mỗi sheet: dòng ghi thời điểm xuất và người xuất, chữ nhỏ màu xám.
- Khổ in đặt sẵn A4 ngang, lặp dòng tiêu đề ở mỗi trang in.

Nội dung dữ liệu giữ nguyên như hiện nay, chỉ thay đổi cách trình bày.

## Chi tiết kỹ thuật

- Thư viện `xlsx` (SheetJS bản cộng đồng) **không ghi được định dạng ô**, nên phần tạo Excel sẽ chuyển sang một trình ghi OOXML nhỏ tự viết, đóng gói bằng `fflate` (đã có sẵn, chạy được trên Worker). Không thêm thư viện nặng/không tương thích Worker.
- Tệp mới `src/lib/students/xlsx-report.server.ts`: dựng `xl/workbook.xml`, `xl/styles.xml` (bảng màu thương hiệu, font Arial, viền, wrap, canh lề), `xl/worksheets/sheetN.xml` (merge tiêu đề, `freezePane`, `autoFilter`, `cols` width, `pageSetup` A4 landscape + `printTitles`), `sharedStrings` bỏ qua bằng cách ghi inline string có escape XML.
- API: `buildStyledWorkbook(sheets: { name, title, subtitle, kind: "fields" | "table", headers, rows, footer }[]): Uint8Array`.
- `buildXlsx` trong `src/lib/students/export360.server.ts` gọi hàm mới, giữ nguyên chữ ký và toàn bộ dữ liệu `d.sections`; giữ quy tắc tên sheet duy nhất ≤ 31 ký tự, bỏ ký tự cấm `[]:*?/\`.
- Không đổi route xuất, quyền, nhật ký xuất hay gói ZIP.
- Kiểm chứng: xuất thử hồ sơ demo KZ26769005 ở cả định dạng Excel và ZIP, mở lại bằng thư viện đọc để xác nhận đủ sheet, đúng số dòng và không lỗi.

## Rà soát trùng lặp

- Chỉ có một nơi tạo Excel hồ sơ 360° (`buildXlsx`); `exportStudentsCsv` là xuất danh sách CSV, không liên quan.
- Cập nhật lại bài hướng dẫn "Xuất hồ sơ 360° học viên" trong `/admin/huong-dan` để mô tả bố cục Excel mới.

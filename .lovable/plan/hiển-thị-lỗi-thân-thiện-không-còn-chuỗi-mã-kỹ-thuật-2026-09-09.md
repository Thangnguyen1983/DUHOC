# Hiển thị lỗi thân thiện — không còn chuỗi mã kỹ thuật

## Vấn đề đang thấy
Khi nhập kho hồ sơ giấy, ô "Mã hồ sơ học viên (UUID)" nhận mã học viên `KZ26769005` nên hệ thống báo lỗi bằng chuỗi kỹ thuật:
`[{"validation":"uuid","code":"invalid_string","message":"Invalid uuid","path":["student_profile_id"]}]`.
Đây là kiểu lỗi chung của toàn hệ thống: mọi thông báo lỗi đều in nguyên văn nội dung kỹ thuật từ máy chủ.

## Hai việc cần làm

### 1. Bộ dịch lỗi dùng chung cho toàn hệ thống
Thêm một bộ chuyển đổi lỗi ở `src/lib/errors.ts`:
- Nhận diện chuỗi/mảng lỗi kiểm tra dữ liệu (Zod) và đổi thành câu tiếng Việt theo đúng ô nhập, ví dụ: "Chưa chọn học viên", "Tên tài liệu không được để trống", "Ngày nhập kho không hợp lệ".
- Nhận diện lỗi cơ sở dữ liệu thường gặp (trùng dữ liệu, thiếu quyền, vi phạm ràng buộc, hết phiên đăng nhập) và đổi thành câu dễ hiểu kèm gợi ý xử lý.
- Lỗi lạ không nhận diện được: hiện câu chung "Không thực hiện được, vui lòng thử lại" kèm mã tham chiếu ngắn để tra cứu, phần chi tiết kỹ thuật chỉ nằm trong nhật ký, không hiện ra màn hình.
- Tên ô nhập được dịch qua một bảng nhãn tiếng Việt (mã học viên, vị trí kho, số lượng, ngày…).

Thay toàn bộ chỗ đang dùng `e?.message` trong các thông báo lỗi (khoảng 191 điểm trong ~40 trang) bằng bộ dịch này, giữ nguyên logic nghiệp vụ.

### 2. Sửa ô nhập học viên ở "Nhập kho hồ sơ giấy"
Bỏ ô dán mã kỹ thuật. Thay bằng ô tìm học viên: gõ mã học viên (KZ…), họ tên hoặc số điện thoại → hiện danh sách gợi ý → chọn một người. Ô chỉ hợp lệ khi đã chọn đúng học viên; nếu chưa chọn sẽ báo "Vui lòng chọn học viên từ danh sách gợi ý".
Áp dụng cùng cách này cho ô lọc học viên ở trang kho lưu trữ.

## Kỹ thuật
- File mới `src/lib/errors.ts`: `getFriendlyError(err)` xử lý Zod issue array (chuỗi JSON hoặc mảng), `PostgrestError` (`23505`, `23503`, `42501`, `PGRST…`), `Response 401/403/404/500`, `TypeError` mạng.
- Bảng nhãn ô nhập theo `path[0]` + phần mở rộng riêng cho từng màn hình khi cần.
- Máy chủ: tại `src/lib/students/archive.functions.ts` thêm thông điệp tiếng Việt cho `z.string().uuid()` của `student_profile_id`, `location_id`; thêm server function tìm kiếm học viên gọn (mã/tên/điện thoại) tái dùng dữ liệu `student_profiles` hiện có, không tạo bảng hay mã định danh mới.
- Giao diện: component chọn học viên dùng chung, đặt trong `src/components/students/`; dùng ở `src/routes/_authenticated/admin.luu-tru.tsx` và `src/components/students/archive-panel.tsx`.
- Cập nhật hướng dẫn sử dụng trong `src/lib/help/guides.ts` (mục kho lưu trữ): cách chọn học viên và ý nghĩa các cảnh báo mới.

## Kiểm chứng
Chạy dựng bản thử, thử nhập kho khi chưa chọn học viên (phải ra câu tiếng Việt), thử chọn đúng học viên và lưu thành công, thử vài lỗi khác (trùng mã phiếu, thiếu quyền) để xác nhận không còn chuỗi mã hiện ra.

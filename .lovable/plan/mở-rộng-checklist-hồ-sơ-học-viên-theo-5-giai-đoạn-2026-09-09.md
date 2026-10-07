# Mở rộng checklist hồ sơ học viên theo 5 giai đoạn

Nâng cấp checklist giấy tờ hiện có: chia theo giai đoạn, theo dõi hạn nộp, người duyệt và bản giấy đã nhận. Giữ nguyên cách sinh checklist đang chạy, chỉ mở rộng.

## Người dùng thấy gì

Trong hồ sơ học viên, tab **Checklist hồ sơ**:

- Giấy tờ được gom thành 5 nhóm giai đoạn: Đăng ký, Đào tạo, Visa, Xuất cảnh, Sau xuất cảnh. Mỗi nhóm có thanh % hoàn thiện riêng (chỉ đếm giấy tờ bắt buộc, bỏ mục "Không áp dụng"), phía trên vẫn có tổng tiến độ chung.
- Mỗi dòng giấy tờ thêm: ô **hạn nộp** (cán bộ tự nhập, để trống nếu chưa cần), ô tick **Đã nhận bản giấy**, và dòng nhỏ ghi ai đã duyệt, lúc nào.
- Hạn nộp quá ngày hiển thị màu đỏ, sắp tới hạn 7 ngày hiển thị màu cam.
- Đính kèm file vẫn giữ nguyên nhưng là tuỳ chọn, không ảnh hưởng % hoàn thiện.

Trong hồ sơ học viên còn thêm ô chọn **Loại chương trình**: Du học / XKLĐ / Thực tập sinh.

Trong **/admin/catalog**, mỗi loại giấy tờ khai thêm: loại chương trình áp dụng, giai đoạn, và số tháng hiệu lực mặc định (chỉ để tham khảo, không tự đặt hạn).

Khi tạo hồ sơ mới, checklist sinh ra sẽ lọc theo cả thị trường và loại chương trình, và tự gán sẵn giai đoạn cho từng giấy tờ.

## Chi tiết kỹ thuật

Migration:

- `student_document_checklist`: thêm `stage text` (mặc định `dang_ky`, CHECK 5 giá trị), `due_date date`, `verified_by uuid`, `verified_at timestamptz`, `hard_copy_received boolean not null default false`. Cột `note` đã có sẵn, giữ nguyên.
- `catalog_document_types`: thêm `program_type text` (`du_hoc` | `xkld` | `thuc_tap_sinh`, NULL = áp dụng mọi loại), `stage text` mặc định `dang_ky`, `default_validity_months int`.
- `student_profiles`: thêm `program_type text` (NULL cho phép), backfill đoán theo chữ trong `program` hiện có.
- Cập nhật `sync_student_checklist()` (sửa hàm sẵn có, không tạo hàm mới): đọc thêm `program_type` của học viên, lọc `dt.program_type IS NULL OR dt.program_type = _program_type`, và ghi `dt.stage` vào cột `stage`. `due_date` để trống.
- GRANT/RLS giữ theo chuẩn cột hiện có của hai bảng (không tạo policy mới, cột mới nằm trong policy sẵn có).

Mã nguồn:

- `src/lib/students/checklist.functions.ts`: mở rộng `updateInput` với `stage`, `due_date`, `hard_copy_received`; khi đổi `status` sang `verified` thì ghi `verified_by`/`verified_at` (song song `reviewed_by`/`reviewed_at` đang có). Thêm `STAGES` + nhãn tiếng Việt. Giữ nguyên `CHECKLIST_STATUS` và `checklistProgress()`.
- `src/components/students/document-checklist-panel.tsx`: nhóm theo `stage`, gọi `checklistProgress()` cho từng nhóm, thêm ô hạn nộp và ô tick bản giấy, hiển thị người/thời điểm duyệt. Thêm giấy tờ thủ công có chọn giai đoạn.
- `src/lib/catalog/catalog.functions.ts`: bổ sung `program_type`, `stage`, `default_validity_months` vào `docTypeSchema`; `src/routes/_authenticated/admin.catalog.tsx` thêm các ô nhập tương ứng và cột hiển thị.
- `src/lib/students.functions.ts` + form hồ sơ trong `admin.students.$id.tsx`/`admin.students.index.tsx`: thêm `program_type` vào validator và ô chọn.
- `src/lib/help/guides.ts`: bài hướng dẫn "Checklist hồ sơ theo giai đoạn".

## Rà soát trùng lặp

- `student_documents` (file đính kèm) và `student_document_checklist` (mục cần có) là hai lớp khác nhau, giữ nguyên liên kết qua `document_id`.
- `catalog_training_stages` là giai đoạn đào tạo trong lớp học, khác 5 giai đoạn hồ sơ ở đây — không gộp, chỉ đặt tên khác để tránh nhầm.
- Không viết hàm sinh checklist mới; chỉ sửa `sync_student_checklist()` hiện có.

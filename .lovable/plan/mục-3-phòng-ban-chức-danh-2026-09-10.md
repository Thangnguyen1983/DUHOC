# Mục 3 — Phòng ban & chức danh

Thêm thẻ **Phòng ban & chức danh** vào trang Danh mục hệ thống (`/admin/catalog`) và gắn hai ô chọn này vào trang Tài khoản. Không tạo trang/menu mới, không đụng vai trò & quyền. Việc tạo phòng ban/chức danh mới không tự động sinh quyền hay vai trò — phân quyền vẫn do `user_roles`/`has_role` và ma trận quyền quản lý như hiện tại.

## Việc sẽ làm

### 1. Danh mục
- Thẻ mới trong Danh mục hệ thống, chia 2 bảng: **Phòng ban** và **Chức danh**.
- Mỗi mục: mã, tên, mô tả ngắn, thứ tự hiển thị, bật/tắt. Phòng ban có thêm ô chọn "thuộc phòng ban cấp trên" để dựng cây tổ chức.
- Thêm/sửa/tắt ngay tại chỗ; mục đã gán cho tài khoản thì tắt (ngừng dùng) thay vì xoá để giữ dữ liệu cũ.
- Nạp sẵn vài phòng ban thường dùng làm dữ liệu khởi tạo: Ban giám đốc, Tuyển sinh & Tư vấn, Đào tạo, Hồ sơ & Visa, Xuất cảnh, Marketing & Nội dung, CSKH, Hành chính — Nhân sự, Kế toán; kèm các chức danh cơ bản (Trưởng phòng, Phó phòng, Chuyên viên, Nhân viên, Giáo viên, Cộng tác viên). Bạn sửa lại tuỳ ý sau.

### 2. Trang Tài khoản
- Mỗi tài khoản có thêm 2 ô chọn: phòng ban và chức danh, lưu ngay trong hộp thoại sửa tài khoản hiện có.
- Danh sách tài khoản thêm cột **Phòng ban / Chức danh** và bộ lọc theo phòng ban; ở chế độ ma trận vẫn giữ nguyên bố cục.
- Ghi rõ trên giao diện: đây là thông tin nhân sự để tra cứu/lọc, **không ảnh hưởng** quyền truy cập.

### 3. Hướng dẫn sử dụng
Cập nhật bài hướng dẫn: cách tạo phòng ban/chức danh, cách gán cho tài khoản, và lưu ý không liên quan phân quyền.

## Kiểm thử sau khi làm
Tạo vài phòng ban + chức danh, gán cho 2–3 tài khoản, lọc theo phòng ban, mở lại tài khoản đã gán xem lưu đúng, và xác nhận quyền truy cập của các tài khoản đó không thay đổi.

## Chi tiết kỹ thuật
- Bảng mới `catalog_departments` (code, name, description, parent_id tự tham chiếu, sort_order, is_active, timestamps) và `catalog_job_titles` (code, name, description, sort_order, is_active, timestamps). Đủ `GRANT` + RLS: đọc cho `authenticated`, ghi cho `admin` (dùng `has_role`), toàn quyền cho `service_role`; trigger `update_updated_at_column`.
- Bảng `profiles` thêm `department_id`, `job_title_id` (khoá ngoại `ON DELETE SET NULL`), có index. Không tạo bảng người dùng mới, không đụng `user_roles`/`has_role`.
- Server function mở rộng trong `src/lib/catalog/catalog.functions.ts` theo mẫu `assertAnyRole` + `supabaseAdmin` sẵn có; `src/lib/users.functions.ts` bổ sung đọc/ghi 2 cột mới trong phần `profiles.upsert` đang có.
- UI: `src/components/catalog/org-tab.tsx` mới, gắn vào `src/routes/_authenticated/admin.catalog.tsx`; cập nhật `src/routes/_authenticated/admin.users.tsx` cho cột + bộ lọc + ô chọn.
- Quyền: dùng lại `catalog.view` / `catalog.manage`, không thêm khoá quyền mới.
- Xong thì chạy kiểm tra kiểu + build + thử thao tác thực tế trên trang.

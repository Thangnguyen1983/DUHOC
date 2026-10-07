# Rà soát và bổ sung kho phân quyền toàn hệ thống

## Hiện trạng (đã kiểm tra)

**Tài khoản đang có (6):**

| Tài khoản | Vai trò đang gán |
| --- | --- |
| huyentt.kaizen@gmail.com | admin + 14 vai trò khác |
| tuannt.iuv@gmail.com | admin + 7 vai trò khác |
| vuthientinh@gmail.com | admin + 7 vai trò khác |
| nphan3712@gmail.com | content, editor, marketing, seo |
| thomash.de.91@gmail.com | course_instructor, teacher, training_manager, training_staff |
| phongveuyensuong07@gmail.com | student |

3 tài khoản đang giữ đồng thời quyền quản trị tối cao và gần như mọi vai trò nghiệp vụ — không phản ánh đúng trách nhiệm thực tế và khó truy vết khi có sự cố.

**Các trang chưa nằm trong kho phân quyền** (mở cho mọi tài khoản có quyền vào trang quản trị nếu gõ thẳng địa chỉ):
- Tổng quan khối Vận hành & Đào tạo (`/admin/van-hanh`)
- Trang tổng quan hệ thống (`/admin`)
- Khu marketing gốc (`/admin/marketing`) — hiện chỉ có trang chiến dịch con

**Các module dùng nhờ quyền của module khác:**
- Kho lưu trữ hồ sơ vật lý và Tra soát nhật ký đang dùng chung quyền "Xem hồ sơ học viên"
- Chiến dịch marketing đang dùng quyền "Xuất bản nội dung"
- Cấu hình Telegram dùng chung quyền "Cài đặt hệ thống"

**Quyền chưa gán cho vai trò nào ngoài admin:** SLA & cấp tài khoản, Danh mục hệ thống.

## Việc sẽ làm

### 1. Bổ sung nhóm quyền mới
Thêm các quyền: tổng quan khối vận hành, tổng quan hệ thống, kho lưu trữ vật lý, tra soát/nhật ký trách nhiệm, chiến dịch marketing, cấu hình thông báo Telegram.

### 2. Phủ kín bản đồ trang → quyền
Mọi trang trong khu quản trị đều có quyền tương ứng, kể cả trang tổng quan. Riêng "Hướng dẫn sử dụng" giữ mở cho mọi nhân sự nội bộ.

### 3. Gán lại quyền theo vai trò
- Trưởng phòng đào tạo, nhân viên đào tạo: thêm quyền danh mục hệ thống (mức dùng, không xoá).
- Tư vấn, CSKH, visa, xuất cảnh, trưởng thị trường: thêm quyền kho lưu trữ và tổng quan khối.
- Marketing: chuyển sang quyền chiến dịch marketing riêng.
- Vận hành SLA & cấp tài khoản: gán cho trưởng phòng đào tạo và trưởng thị trường.
- Tra soát nhật ký: chỉ admin và trưởng thị trường.

### 4. Menu và trang hiển thị đúng quyền
Cập nhật thanh menu quản trị để từng mục hiện/ẩn theo quyền mới, giữ nguyên bố cục và icon hiện tại.

### 5. Bảng ma trận Tài khoản × Vai trò
Bổ sung cột chú giải các quyền mới; giữ nguyên cách tick và lưu hiện tại.

### 6. Hướng dẫn sử dụng
Cập nhật bài "Tài khoản & phân quyền" trong `/admin/huong-dan`: danh sách quyền mới, nguyên tắc gán vai trò theo trách nhiệm, khuyến nghị hạn chế số tài khoản giữ quyền quản trị tối cao.

## Không thay đổi
- Không tạo bảng vai trò mới, vẫn dùng `user_roles` + `has_role`.
- Không đổi quy tắc bảo vệ dữ liệu ở tầng cơ sở dữ liệu trong bước này.
- Không tự động gỡ vai trò của tài khoản nào — chỉ báo cáo và để bạn quyết định.

## Chi tiết kỹ thuật
- `src/lib/rbac/permissions.ts`: mở rộng `PERMISSIONS`, `PERMISSION_LABEL`, `ROLE_PERMISSIONS`, `ROUTE_PERMISSIONS` (khớp tiền tố dài nhất, thêm `/admin/van-hanh`, `/admin`, `/admin/marketing`, `/admin/luu-tru`, `/admin/tra-soat`, `/admin/telegram`).
- `src/routes/_authenticated/route.tsx`: cập nhật điều kiện `can`/`canAny` cho các `NavItem`/`NavGroup` tương ứng; `NoPermission` tự dùng nhãn mới.
- `src/lib/help/guides.ts`: cập nhật mục phân quyền.
- Không đụng `src/lib/users.functions.ts` (logic lưu vai trò đã xử lý trùng khoá).

## Rà soát trùng lặp
Chỉ có một kho phân quyền duy nhất (`src/lib/rbac`), một trang quản lý tài khoản (`/admin/users`). Không phát sinh module song song.

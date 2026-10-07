# Bảng phân quyền theo vai trò (Vai trò × Quyền) — chỉnh sửa được

Hiện tại `/admin/users` chỉ có bảng **Tài khoản × Vai trò**. Việc "vai trò nào được làm gì" đang cố định trong mã nguồn (`ROLE_PERMISSIONS`), bạn không tự đổi được. Kế hoạch bổ sung một bảng thứ hai: **Vai trò × Quyền**, tick chọn và lưu lại, áp dụng ngay cho mọi tài khoản mang vai trò đó.

## Giao diện mới

- Thêm nút chuyển thứ ba trên `/admin/users`: **Ma trận phân quyền** | **Danh sách** | **Vai trò × Quyền**.
- Bảng: mỗi **hàng là một quyền** (nhóm theo khối: Tổng quan, Nội dung & SEO, Học viên, Vận hành, Đào tạo, E-learning, Hệ thống — và ghi rõ Xem/Sửa), mỗi **cột là một vai trò** (17 vai trò). Cột tên quyền ghim cố định khi cuộn ngang.
- Tick/bỏ tick là lưu ngay (cập nhật lạc quan, lỗi thì tự hoàn tác), giống bảng tài khoản hiện có.
- Vai trò **Quản trị viên (Admin)** luôn đủ quyền, cột này khoá không cho bỏ tick.
- Mỗi hàng có nút "Đặt lại mặc định" cho quyền đó; đầu bảng có nút "Đặt lại toàn bộ về mặc định hệ thống".
- Ô nào khác mặc định gốc thì hiện dấu chấm nhỏ để dễ nhận ra phần đã tuỳ chỉnh.
- Chỉ tài khoản có quyền quản lý tài khoản mới vào và sửa được bảng này.

## Cách hoạt động

- Bộ quyền mặc định trong mã nguồn vẫn giữ nguyên làm nền. Bảng mới lưu **bản ghi đè** vào cơ sở dữ liệu.
- Khi có bản ghi đè cho một vai trò, hệ thống dùng danh sách trong cơ sở dữ liệu cho vai trò đó; chưa từng chỉnh thì dùng mặc định.
- Quyền hiệu lực của một tài khoản = hợp của các vai trò đang giữ. Menu, trang và chế độ "chỉ xem" tự cập nhật theo.
- Người dùng đang đăng nhập sẽ thấy thay đổi trong vòng ~1 phút hoặc ngay khi tải lại trang.
- Đây là lớp kiểm soát giao diện/đường dẫn; ràng buộc dữ liệu ở tầng cơ sở dữ liệu (RLS theo vai trò) giữ nguyên, không đổi trong bước này.

## Chi tiết kỹ thuật

- Migration: bảng `public.role_permissions (role app_role, permission text, primary key (role, permission), created_at, created_by)` + GRANT (`authenticated` select, `service_role` all) + RLS: mọi tài khoản đã đăng nhập được đọc, chỉ `has_role(auth.uid(),'admin')` được ghi/xoá.
- `src/lib/rbac/permissions.ts`: thêm `PERMISSION_GROUPS` (nhóm hiển thị) và hàm `permissionsForRoles(roles, overrides?)` nhận bản ghi đè; giữ nguyên toàn bộ key và `ROLE_PERMISSIONS` mặc định.
- `src/lib/rbac/role-permissions.functions.ts` (mới): `getRolePermissionMatrix` (mặc định + ghi đè), `setRolePermission({role, permission, enabled})`, `resetRolePermissions({role?, permission?})` — dùng `requireSupabaseAuth`, kiểm tra vai trò admin qua `context.supabase` trước khi ghi.
- `src/lib/roles.functions.ts`: `getMyRoles` đọc thêm `role_permissions` để tính quyền hiệu lực.
- `src/routes/_authenticated/admin.users.tsx`: thêm chế độ xem `RolePermissionMatrix` cùng nút chuyển; dùng `useMutation` + cache `["role-permissions"]`.
- `src/lib/help/guides.ts`: cập nhật bài "Tài khoản & phân quyền" — cách dùng bảng Vai trò × Quyền, nguyên tắc gán theo trách nhiệm, cảnh báo khi gỡ quyền của vai trò đang dùng.
- Chạy lại `tests/unit/rbac-route-coverage.test.ts`, typecheck và build.

## Rà soát trùng lặp

Chỉ có một kho phân quyền `src/lib/rbac` và một trang quản lý tài khoản `/admin/users`. Bảng mới nằm cùng trang, dùng chung kho quyền — không tạo module song song, không tạo bảng vai trò mới (vẫn `user_roles` + `has_role`).

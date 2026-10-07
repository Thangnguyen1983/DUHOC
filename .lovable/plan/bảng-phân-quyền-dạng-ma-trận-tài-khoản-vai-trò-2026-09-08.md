# Bảng phân quyền dạng ma trận (Tài khoản × Vai trò)

Thiết kế lại trang **Tài khoản & Quyền** (`/admin/users`) để tiết kiệm không gian: thay vì mở hộp thoại từng người, admin tick trực tiếp trên một bảng ma trận.

## Giao diện mới

- Bảng cuộn ngang: mỗi **hàng là một tài khoản** (email + họ tên + trạng thái), mỗi **cột là một vai trò** (17 vai trò, nhóm theo khối: Nội dung, Vận hành, Đào tạo, Kinh doanh, Hệ thống).
- Cột đầu (email/tên) ghim cố định khi cuộn ngang; tiêu đề cột xoay dọc/viết tắt kèm chú giải khi rê chuột để cột hẹp.
- Tick/bỏ tick ô là lưu ngay (optimistic UI + thông báo ngắn); lỗi thì tự hoàn tác.
- Không cho tự gỡ vai trò admin của chính mình (giữ nguyên quy tắc an toàn hiện có).
- Cột cuối giữ các nút thao tác hiện tại: đặt mật khẩu, gửi link đặt lại, khoá/mở khoá, xoá.
- Giữ ô tìm kiếm và bộ lọc vai trò; thêm nút chuyển "Xem dạng ma trận / Xem dạng danh sách" để vẫn dùng được bảng cũ khi cần.

## Bỏ hiển thị danh sách tính năng

- Gỡ khối "Quyền hiệu lực" (danh sách nhãn quyền dài) hiển thị dưới tên tài khoản trong hộp thoại sửa vai trò.
- Thay bằng một dòng tóm tắt ngắn: số lượng quyền hiệu lực, chi tiết chỉ hiện khi rê chuột.

## Chi tiết kỹ thuật

- Sửa `src/routes/_authenticated/admin.users.tsx`: thêm component `RoleMatrixTable`, dùng lại `listUsers` và `setUserRoles` (`src/lib/users.functions.ts`) — không đổi backend, không đổi RLS.
- Lưu theo từng ô: gửi trọn bộ `roles` mới của tài khoản đó qua `setUserRoles`; dùng `useMutation` + cập nhật cache `["admin-users"]`.
- Nhóm cột lấy từ `groupRoles()`/`ROLE_GROUP_LABEL` trong `src/lib/rbac/catalog.ts`.
- Bỏ `PermissionPreview` khỏi hộp thoại; giữ `permissionsForRoles` cho phần đếm số quyền.

## Hướng dẫn sử dụng

- Cập nhật mục Tài khoản & Phân quyền trong `src/lib/help/guides.ts` mô tả cách dùng bảng ma trận.

## Rà soát trùng lặp

- Phân quyền chỉ tồn tại ở `/admin/users`; không có module song song. Không phát sinh trùng lặp.

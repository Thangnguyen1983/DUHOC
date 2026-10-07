# Chia nhỏ phân quyền khối Vận hành & Đào tạo

Hiện nay cả khối chỉ có vài quyền gộp lớn: `students.view/manage`, `training.manage`, `workflow.manage`, `operations.manage`... Một người được cấp "Chương trình & lớp học" là đồng thời xem được lịch trung tâm, giám sát lớp, điểm danh, điểm số và sửa tất cả. Kế hoạch tách thành cặp **Xem / Sửa** cho từng trang chức năng.

## Bộ quyền mới (Xem / Sửa)

| Nhóm | Chức năng | Quyền xem | Quyền sửa |
| --- | --- | --- | --- |
| Học viên | Hồ sơ học viên | xem hồ sơ | cập nhật hồ sơ |
| Học viên | Kho lưu trữ vật lý | xem kho | mượn/trả, sửa vị trí |
| Học viên | Tra soát nhật ký | xem nhật ký | (không có) |
| Vận hành | Tổng quan khối | xem tổng quan | (không có) |
| Vận hành | Hồ sơ visa | xem visa | cập nhật visa |
| Vận hành | Quy trình (workflow) | xem tiến trình | chuyển bước, sửa cấu hình |
| Vận hành | SLA & cấp tài khoản Portal | xem | chạy quét, gửi mời |
| Đào tạo | Chương trình đào tạo | xem | tạo/sửa chương trình |
| Đào tạo | Lớp học | xem lớp | tạo/sửa lớp, phân công giáo viên |
| Đào tạo | Lịch trung tâm | xem lịch | sửa buổi học |
| Đào tạo | Giám sát lớp học | xem | phân công/điều chỉnh |
| Đào tạo | Điểm danh | xem | điểm danh, tạo mã QR |
| Đào tạo | Điểm số | xem | chấm/sửa điểm |
| Đào tạo | Thống kê đào tạo | xem | (không có) |
| Đào tạo | Giáo viên | xem | thêm/sửa hồ sơ giáo viên |
| Đào tạo | Bài học | xem | tạo/sửa |
| Đào tạo | Tài liệu | xem | tải lên/sửa |
| Đào tạo | Bài kiểm tra | xem | tạo/sửa/chấm |
| Đào tạo | Chứng chỉ | xem | cấp/thu hồi |
| Đào tạo | Danh mục hệ thống | xem | sửa danh mục |

## Gán lại vai trò (đề xuất)

- **Trưởng phòng đào tạo**: xem + sửa toàn bộ nhánh đào tạo, lớp, giáo viên, chứng chỉ, danh mục; xem hồ sơ học viên và visa (không sửa visa).
- **Nhân viên đào tạo**: xem toàn bộ đào tạo; sửa lớp, lịch, điểm danh, tài liệu, bài học; không sửa chương trình, giáo viên, chứng chỉ, danh mục.
- **Giáo viên**: xem lớp/lịch/bài học/tài liệu/bài kiểm tra; sửa điểm danh, điểm số, bài học, tài liệu, bài kiểm tra của mình. Không xem hồ sơ học viên toàn hệ thống, không cấp chứng chỉ.
- **Tư vấn / CSKH**: xem + sửa hồ sơ học viên, xem visa, xem kho lưu trữ; không đụng đào tạo.
- **Cán bộ visa**: xem + sửa visa và quy trình; xem hồ sơ học viên, sửa hồ sơ.
- **Điều phối xuất cảnh**: như visa, thêm sửa quy trình bước cuối.
- **Trưởng thị trường**: xem tất cả trong khối + nhật ký tra soát; sửa hồ sơ học viên và quy trình.
- **Quản trị viên**: giữ nguyên toàn quyền.

Không tự động gỡ vai trò của tài khoản nào; chỉ đổi phạm vi quyền của từng vai trò.

## Hiển thị

- Menu quản trị: mỗi mục hiện khi có quyền **xem** tương ứng.
- Trong trang: các nút tạo/sửa/xoá chỉ hiện khi có quyền **sửa**; không có thì trang ở chế độ chỉ đọc thay vì chặn vào.
- Bảng ma trận Tài khoản × Vai trò: nhóm quyền mới theo khối, hiển thị dạng Xem/Sửa cạnh nhau cho gọn.

## Chi tiết kỹ thuật

- `src/lib/rbac/permissions.ts`: mở rộng `PERMISSIONS` theo cặp `*.view` / `*.edit`, cập nhật `PERMISSION_LABEL`, `ROLE_PERMISSIONS`, `ROUTE_PERMISSIONS` (route gắn với quyền **xem**, khớp tiền tố dài nhất, thêm `/admin/training/classes`, `/admin/training/schedule`, `/admin/training/oversight`, `.../attendance`, `.../grades`, `/admin/workflow/config`).
- Giữ tương thích: `students.view/manage`, `training.manage`... được ánh xạ sang quyền mới để không vỡ chỗ đang dùng; sau đó thay dần trong các trang.
- `src/routes/_authenticated/route.tsx`: cập nhật điều kiện `can()` cho từng `NavItem` trong nhóm Vận hành & Đào tạo (desktop + drawer mobile).
- Các trang trong khối: bọc nút hành động bằng `Can` / `can("...edit")`.
- `tests/unit/rbac-route-coverage.test.ts`: chạy lại để đảm bảo mọi route admin đều có quyền cụ thể.
- `src/lib/help/guides.ts`: cập nhật bài "Tài khoản & phân quyền" và mục "Kho quyền theo module" với bảng Xem/Sửa mới.
- Không tạo bảng vai trò mới; vẫn dùng `user_roles` + `has_role`. Không đổi RLS trong bước này (RLS hiện đã chặn theo vai trò ở tầng dữ liệu).

## Rà soát trùng lặp

Chỉ tồn tại một kho phân quyền `src/lib/rbac`, một trang quản lý tài khoản `/admin/users`. Không phát sinh module song song.

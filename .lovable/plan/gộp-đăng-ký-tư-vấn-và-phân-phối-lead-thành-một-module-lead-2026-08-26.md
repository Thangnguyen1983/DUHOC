# Gộp "Đăng ký tư vấn" và "Phân phối lead" thành một module Lead

## Vấn đề

Trên thanh menu quản trị có 2 mục đứng cạnh nhau, cùng icon, cùng quyền `leads.view`:

- Đăng ký tư vấn (`/admin/leads`) — danh sách khách đăng ký, đổi trạng thái, tạo hồ sơ học viên
- Phân phối lead (`/admin/leads/queue`) — hàng đợi giao khách, nhận khách, khai báo sales agent

Cả hai đọc cùng một bảng dữ liệu `consultations`, nên nhìn như trùng tab và gây nhầm lẫn khi vận hành.

## Hướng xử lý

Giữ nguyên toàn bộ chức năng, chỉ gộp lại thành **một module duy nhất** trên menu:

- Menu chỉ còn 1 mục: **Khách hàng tiềm năng (Lead)** trỏ tới `/admin/leads`
- Trong trang có 2 tab:
  - **Danh sách đăng ký** — nội dung trang `/admin/leads` hiện tại
  - **Phân phối & Sales** — nội dung trang `/admin/leads/queue` hiện tại
- Đường dẫn `/admin/leads/queue` vẫn hoạt động (mở thẳng tab Phân phối), không hỏng link cũ hay bookmark

## Chi tiết kỹ thuật

- Tách phần thân của 2 route hiện tại thành component: `src/components/leads/leads-inbox.tsx` và `src/components/leads/leads-queue.tsx` (bê nguyên logic, không đổi server function).
- `src/routes/_authenticated/admin.leads.tsx`: layout có `Tabs`, tab mặc định `inbox`, đồng bộ tab qua search param `?tab=queue`.
- `src/routes/_authenticated/admin.leads.queue.tsx`: chuyển thành redirect sang `/admin/leads?tab=queue`.
- `src/routes/_authenticated/route.tsx`: xoá NavItem "Phân phối lead", đổi nhãn NavItem còn lại thành "Khách hàng tiềm năng (Lead)".
- Không thay đổi database, RLS, hay logic phân phối tự động.

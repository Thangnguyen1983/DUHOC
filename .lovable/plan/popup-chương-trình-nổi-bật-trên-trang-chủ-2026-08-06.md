# Popup chương trình nổi bật trên trang chủ

Hiển thị một popup (modal) ngay khi khách truy cập trang chủ để quảng bá chương trình cần tiếp cận tức thì, và cho phép admin tự thêm/sửa/xoá/bật-tắt trong trang quản trị.

## Trải nghiệm khách truy cập

- Vào trang chủ, sau khoảng 1,5 giây popup hiện lên giữa màn hình: ảnh, tiêu đề, mô tả ngắn, nút hành động (ví dụ "Đăng ký tư vấn"), nút đóng.
- Đóng bằng nút X, phím Esc hoặc bấm ra ngoài.
- Sau khi đóng, không hiện lại trong khoảng thời gian admin cấu hình (mặc định 24 giờ, lưu trên trình duyệt).
- Nếu có nhiều popup đang bật, hiển thị popup có thứ tự ưu tiên cao nhất còn hiệu lực.
- Responsive: full-width trên mobile, khung tối đa ~520px trên desktop.

## Quản trị (trang mới `/admin/popups`)

- Danh sách popup với ảnh xem trước, trạng thái bật/tắt, thời gian hiệu lực.
- Thêm mới / sửa: tiêu đề, mô tả, ảnh (tải lên qua thư viện media hiện có), nhãn nút, đường dẫn nút, ngày bắt đầu – ngày kết thúc (tuỳ chọn), số giờ ẩn sau khi khách đóng, bật/tắt.
- Sắp xếp thứ tự ưu tiên (lên/xuống) và xoá.
- Nút "Xem thử" hiển thị popup ngay trong admin.
- Menu nằm trong nhóm "Nội dung website", dùng quyền `banners.manage` như Banner / Chương trình hot.

## Kỹ thuật

- Migration tạo bảng `public.site_popups`: `title`, `description`, `image_url`, `cta_label`, `cta_href`, `starts_at`, `ends_at`, `dismiss_hours`, `position`, `active`, kèm `created_at`/`updated_at` + trigger. GRANT cho `anon` (chỉ đọc), `authenticated`, `service_role`; bật RLS: ai cũng đọc được popup đang bật, chỉ admin/editor được thêm/sửa/xoá.
- `src/lib/site-popups.functions.ts`: `listActivePopup` (public, dùng publishable client), `listAllPopups` / `createPopup` / `updatePopup` / `deletePopup` / `reorderPopups` (dùng `requireSupabaseAuth` + kiểm tra vai trò admin/editor), theo đúng mẫu của `hot-programs.functions.ts`.
- `src/components/site-popup.tsx`: modal client-side, đọc `localStorage` để nhớ lần đóng, gắn vào trang chủ (`src/routes/index.tsx`) để chỉ chạy ở trang chủ.
- `src/routes/_authenticated/admin.popups.tsx`: giao diện CRUD theo mẫu `admin.banners.tsx`; thêm mục menu và route-permission trong `src/lib/rbac/permissions.ts` + `_authenticated/route.tsx`.

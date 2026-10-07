# Thiết kế lại Dashboard tổng quan (/admin)

## Mục tiêu
Trang `/admin` hiện chỉ có 4 ô số + danh sách đăng ký. Thay bằng một bảng điều khiển hiện đại, tổng quan toàn hệ thống KAIZEN: khách hàng tiềm năng, học viên, đào tạo, visa, nội dung website, khoá học trực tuyến, marketing và cảnh báo cần xử lý.

## Rà soát trùng lặp (theo quy trình bắt buộc)
- Đã có `/admin/van-hanh` (dashboard chuyên sâu Vận hành & Đào tạo, 6 biểu đồ tròn) — **giữ nguyên**, không sao chép.
- `/admin` sẽ là **tầng tổng quan toàn hệ thống**: chỉ hiển thị chỉ số đầu mối + đường dẫn sang trang chuyên sâu (van-hanh, leads, cms, courses, marketing). Không tạo bảng mới, không tạo hàm thống kê song song cho phần vận hành — tái sử dụng `getOperationsOverview`.
- Không tạo module/route mới ngoài chính trang `/admin`.

## Bố cục mới (từ trên xuống)
1. **Thanh chào & bộ lọc thời gian**: lời chào theo giờ, ngày cập nhật, nút làm mới.
2. **6 thẻ KPI nổi bật** (gradient + icon 3D theo phong cách sidebar hiện tại): Lead mới / Tổng học viên / Đang đào tạo / Hồ sơ visa / Bài viết đã xuất bản / Đơn hàng khoá học.
3. **Dải cảnh báo cần xử lý**: hợp đồng sắp hết hạn, hồ sơ giấy tờ quá hạn, hàng đợi cấp tài khoản, lead chưa liên hệ — mỗi mục là chip bấm sang đúng trang.
4. **Biểu đồ**:
   - Đường/area: lead theo 30 ngày gần nhất.
   - Donut: học viên theo chương trình (du học / XKLĐ / thực tập sinh).
   - Donut: trạng thái visa.
   Dùng `recharts` đã cài sẵn, cùng bảng màu và kiểu khung viền của `/admin/van-hanh`.
5. **3 cột danh sách**: Đăng ký gần đây · Lớp đang chạy · Bài viết mới nhất.
6. **Truy cập nhanh**: lưới thẻ icon màu dẫn tới các module chính, lọc theo quyền của tài khoản.
7. **Khối tiện ích hệ thống**: kiểm tra Telegram (giữ nguyên chức năng cũ) + tỉ lệ điểm danh, chứng chỉ đã cấp.

Toàn bộ dùng token màu trong `src/styles.css`, viền bo tròn, đổ bóng nhẹ, hover nâng nhẹ — đồng bộ với sidebar và trang vận hành. Responsive: 1 cột mobile → 2 cột md → 3–6 cột xl.

## Kỹ thuật
- Thêm `src/lib/dashboard/overview.functions.ts`: server function `getAdminDashboard` (middleware `requireSupabaseAuth`), gộp trong một lần gọi: đếm lead theo trạng thái + chuỗi 30 ngày, bài viết CMS, khoá học/đơn hàng, chiến dịch marketing đang chạy. Phần học viên/đào tạo/visa/cảnh báo lấy lại từ `getOperationsOverview` (không viết lại truy vấn).
- Kiểm tra quyền như các trang hiện có; nếu tài khoản không đủ quyền xem khối vận hành thì khối đó tự ẩn thay vì lỗi.
- Viết lại `src/routes/_authenticated/admin.index.tsx` với các component con `KpiCard`, `AlertChip`, `PanelCard`, `QuickLink`; giữ nguyên `TelegramTestButton`.
- Không đổi dữ liệu, quyền hay các route khác.

## Hướng dẫn sử dụng
Cập nhật `src/lib/help/guides.ts`: bổ sung/ghi lại bài hướng dẫn "Dashboard tổng quan" — ý nghĩa từng KPI, cách đọc cảnh báo, phân biệt với trang Vận hành & Đào tạo.

## Kiểm chứng
`bun run build:dev`, kiểm tra trang bằng Playwright (không lỗi console, đủ khối, không tràn ngang ở 390px và 1440px).

# Danh mục hệ thống — làm tuần tự 3 mục

Tất cả nằm trong trang **Vận hành & Đào tạo → Danh mục hệ thống** (`/admin/catalog`), thêm tab mới, không tạo trang/menu mới, không đụng vào cơ chế vai trò & quyền hiện có.

Nguyên tắc chung: làm xong **một mục** → kiểm thử (nhập/sửa/xoá, hiển thị đúng ở nơi dùng, không lỗi build) → mới sang mục kế tiếp.

---

## Mục 1 — Địa danh hành chính (làm trước)

Việt Nam hiện áp dụng mô hình 2 cấp: **Tỉnh/Thành phố → Xã/Phường/Đặc khu** (không còn cấp huyện). Danh mục sẽ theo đúng chuẩn này.

Việc cần làm:
- Tab **Địa danh** với 2 bảng: Tỉnh/Thành phố và Xã/Phường (lọc theo tỉnh, có ô tìm kiếm).
- Nhập sẵn dữ liệu ban đầu từ sheet tra cứu của file mẫu xuất cảnh đã có trong hệ thống, đối chiếu với danh sách đơn vị hành chính hiện hành; ghi rõ ngày cập nhật và nguồn cho từng đợt.
- Cho phép thêm/sửa/ẩn từng địa danh, đánh dấu địa danh cũ là "ngừng dùng" thay vì xoá, kèm ghi chú "gộp vào / đổi tên từ" để tra cứu hồ sơ cũ.
- Nút **Cập nhật danh sách chuẩn** để nạp lại đợt dữ liệu mới, chỉ thêm/đánh dấu thay đổi, không ghi đè phần đã chỉnh tay.
- Nơi dùng: ô quê quán / thường trú trong hồ sơ học viên và biểu mẫu xuất cảnh chuyển sang chọn từ danh mục (vẫn cho gõ tay nếu không tìm thấy). Dữ liệu cũ giữ nguyên, không sửa ngược.

Kiểm thử mục 1: đếm số tỉnh/xã đã nạp, thử tìm kiếm và lọc, chọn địa danh trong một hồ sơ học viên và một bản ghi xuất cảnh rồi lưu lại, xuất file xuất cảnh xem cột địa danh ra đúng.

---

## Mục 2 — Thị trường

- Chuyển toàn bộ thị trường đang nằm trong mã nguồn (11 thị trường: Nhật, Hàn, Đài, Đức, Hungary, Ba Lan, Romania, Slovakia, Latvia, Bulgaria...) thành danh mục sửa được: tên, cờ, khu vực (Châu Á / Châu Âu), slug, mô tả ngắn, điểm nổi bật, thứ tự, bật/tắt, đánh dấu "nổi bật trang chủ".
- Nội dung hiện tại được nạp làm dữ liệu khởi tạo, chữ nghĩa giữ nguyên 100%.
- Các trang công khai (du học, XKLĐ, trang chủ) đọc từ danh mục; nếu chưa có dữ liệu thì tự dùng nội dung gốc nên trang không bao giờ trắng.
- Slug giữ nguyên để không hỏng đường dẫn và thứ hạng tìm kiếm.

Kiểm thử mục 2: đổi tên/thứ tự một thị trường trong quản trị rồi mở trang chủ và trang thị trường tương ứng xem cập nhật đúng; kiểm tra 11 đường dẫn thị trường vẫn mở được.

---

## Mục 3 — Phòng ban & chức danh

- Tab **Phòng ban & chức danh** trong danh mục: mã, tên, phòng ban cha (nếu có), thứ tự, bật/tắt.
- Trang **Tài khoản** thêm 2 cột/ô chọn: phòng ban và chức danh cho từng tài khoản, có bộ lọc theo phòng ban.
- Đây chỉ là thông tin nhân sự để tra cứu và lọc — **không ảnh hưởng** tới vai trò, quyền hay khả năng truy cập.

Kiểm thử mục 3: tạo vài phòng ban, gán cho 2–3 tài khoản, lọc theo phòng ban, và xác nhận quyền truy cập của các tài khoản đó không thay đổi.

---

## Chi tiết kỹ thuật

- Bảng mới: `catalog_provinces`, `catalog_wards` (khoá ngoại tới tỉnh, cột `is_active`, `merged_from`, `source`, `synced_at`), `catalog_markets`, `catalog_departments`, `catalog_job_titles`. Mỗi bảng đủ `GRANT` + RLS: đọc cho vai trò vận hành/đào tạo, sửa cho `admin` (và `training_manager` với tab đào tạo), `service_role` toàn quyền.
- Gán nhân sự: cột `department_id`, `job_title_id` trên bảng hồ sơ nhân sự hiện có (`profiles`), không tạo bảng người dùng mới, không đụng `user_roles`/`has_role`.
- Server function mở rộng trong `src/lib/catalog/catalog.functions.ts` theo đúng mẫu `assertAnyRole` + `supabaseAdmin` sẵn có.
- `src/lib/markets.ts` giữ nguyên làm nguồn seed và fallback; thêm hàm đọc danh mục cho trang công khai (đọc bằng khoá công khai, chính sách chỉ cho đọc bản ghi đang bật).
- Hồ sơ học viên / xuất cảnh: thêm cột tham chiếu địa danh, giữ nguyên cột chữ cũ để không mất dữ liệu.
- Quyền: dùng lại `catalog.view` / `catalog.manage`, thêm `catalog.geo.manage` cho việc nạp lại danh sách địa danh chuẩn.
- Sau mỗi mục: cập nhật hướng dẫn sử dụng trong `src/lib/help/guides.ts`, chạy kiểm tra kiểu + build + thử thao tác thực tế trên trang.

# Lưu địa bàn khi tạo hồ sơ + tự động đồng bộ danh mục địa danh

## Hiện trạng (đã kiểm tra)

- Bảng hồ sơ học viên đã có 15 cột địa bàn (Quê quán / Thường trú / Nơi ở hiện tại: mã + tên tỉnh, mã + tên xã, địa chỉ chi tiết). Khối "Nơi ở & địa bàn" ở thẻ Tổng quan đã lưu được khi **sửa** hồ sơ.
- Thao tác **Tạo hồ sơ học viên** mới chỉ "chấp nhận" các trường địa bàn ở phần kiểm tra dữ liệu, nhưng: form chưa có ô chọn, và lệnh ghi vào bảng chưa ghi các trường này → tạo mới xong địa bàn vẫn trống.
- Danh mục địa danh (34 tỉnh, 3.321 xã) hiện chỉ cập nhật khi bấm tay nút "Cập nhật danh sách chuẩn" trong Danh mục hệ thống; chưa có lịch chạy ngầm.

## Phần 1 — Tạo hồ sơ có đầy đủ địa bàn

- Form "Tạo hồ sơ học viên" thêm mục **Nơi ở & địa bàn** (thu gọn, mở ra khi cần) với 3 khối Quê quán / Thường trú / Nơi ở hiện tại, dùng lại đúng ô chọn Tỉnh → Xã và địa chỉ chi tiết của khối trong trang chi tiết, kèm nút "Nơi ở hiện tại = Thường trú". Không bắt buộc nhập.
- Khi lưu: ghi toàn bộ 15 trường vào đúng dòng hồ sơ học viên vừa tạo, đồng thời tự ghép chuỗi chữ cho 2 ô cũ (Quê quán / Thường trú dạng chữ) để báo cáo, xuất Excel/PDF 360° và biểu mẫu xuất cảnh cũ vẫn đọc được.
- Chống nhập sai: máy chủ đối chiếu mã tỉnh/xã gửi lên với danh mục; nếu mã không tồn tại hoặc xã không thuộc tỉnh đã chọn thì báo lỗi rõ ràng, không lưu dữ liệu lệch.
- Nhật ký trách nhiệm ghi nhận các trường địa bàn ngay từ lúc tạo hồ sơ.
- Thẻ Tổng quan: giữ khối "Nơi ở & địa bàn" hiện có; bổ sung dòng tóm tắt địa chỉ đầy đủ ở phần thông tin đầu trang để nhìn nhanh không cần cuộn.

## Phần 2 — Danh mục địa danh luôn mới nhất

- Tạo lịch chạy ngầm **mỗi tuần một lần** (Chủ nhật 2h sáng) tự nạp lại danh sách đơn vị hành chính chuẩn từ nguồn chính thức, dùng lại đúng hàm đồng bộ hiện có: chỉ thêm mới / cập nhật tên, **không ghi đè** phần đã chỉnh tay (ẩn/hiện, ghi chú gộp).
- Ghi lại kết quả mỗi lần chạy (thời điểm, số tỉnh/xã, thành công hay lỗi) và hiển thị "Lần đồng bộ gần nhất" trong thẻ Địa danh; nếu nguồn lỗi thì giữ nguyên dữ liệu cũ và báo cho quản trị.
- Nút "Cập nhật danh sách chuẩn" vẫn giữ để chạy tay khi cần.
- Dropdown ở hồ sơ học viên, form tạo hồ sơ và xuất cảnh đều đọc trực tiếp từ danh mục nên tự có dữ liệu mới, không cần sửa thêm.

## Kiểm thử

1. Tạo hồ sơ mới có chọn đủ 3 địa chỉ → mở Tổng quan thấy đúng, kiểm tra dòng dữ liệu trong bảng có đủ 15 trường + 2 ô chữ.
2. Tạo hồ sơ không chọn địa bàn → vẫn tạo bình thường.
3. Gửi mã xã không thuộc tỉnh → bị từ chối với thông báo tiếng Việt.
4. Chạy tay lịch đồng bộ → số tỉnh/xã không đổi, cờ ẩn/ghi chú thủ công giữ nguyên, thời điểm đồng bộ được cập nhật.
5. Kiểm tra giao diện form tạo trên màn hình điện thoại không tràn.

## Chi tiết kỹ thuật

- `src/lib/students.functions.ts`: `createStudent` ghi 15 trường địa bàn + `place_of_origin`/`place_of_residence` ghép chuỗi; thêm hàm dùng chung `validateGeoCodes(supabaseAdmin, patch)` áp cho cả `createStudent` và `updateStudent` (kiểm tra `catalog_provinces.code`, `catalog_wards.code` + `province_code`).
- `src/components/students/address-panel.tsx`: tách `AddressBlock`/`AddressFields` thành phần dùng lại được (controlled, không tự lưu) để nhúng vào form tạo trong `src/routes/_authenticated/admin.students.index.tsx`; `AddressPanel` giữ nguyên hành vi.
- Đồng bộ định kỳ: route `src/routes/api/public/hooks/geo-sync.ts` (POST, xác thực bằng bearer secret riêng `GEO_SYNC_SECRET`, dùng lại logic của `syncStandardGeo` tách ra `src/lib/catalog/geo-sync.server.ts`); migration `pg_cron` + `pg_net` gọi route hàng tuần theo mẫu job email hiện có; bảng nhỏ `catalog_sync_logs` (kind, started_at, finished_at, status, counts, error) có GRANT + RLS đọc cho `catalog.view`.
- Thẻ Địa danh (`src/components/catalog/geo-tab.tsx`): hiển thị lần đồng bộ gần nhất từ `catalog_sync_logs`.
- Cập nhật hướng dẫn trong `src/lib/help/guides.ts` (mục Hồ sơ học viên và Danh mục hệ thống); không tạo bảng học viên mới, không tạo mã định danh mới, không đụng vai trò/quyền.

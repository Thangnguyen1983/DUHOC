# Lộ trình Hệ thống Quản lý hồ sơ xuất cảnh (theo sơ đồ mới)

Quyết định đã chốt: mã hồ sơ THAY THẾ hoàn toàn; số thứ tự chạy liên tục toàn hệ thống; phân quyền theo PHÒNG BAN; làm Đợt 1 trước.

## Đợt 1 – Nền tảng (đang làm)
- [x] Danh mục loại giấy tờ hồ sơ xuất cảnh/du học theo sơ đồ (bổ sung vào catalog_document_types)
- [x] catalog_departments: thêm chức năng/thị trường phụ trách + loại hình (17 phòng ban)
- [x] Quy tắc mã hồ sơ mới + sinh số thứ tự liên tục toàn hệ thống (sequence + trigger)
- [x] Hồ sơ CBNV: CCCD, ngày sinh, điện thoại, trình độ, chứng chỉ nghiệp vụ du học/XKLĐ, phòng ban, quyền
- [x] Phạm vi đơn vị: gán người dùng vào phòng ban + 3 mức quyền (chỉ đọc/gửi báo cáo/toàn quyền)
- [x] Hiển thị mã mới ở danh sách & chi tiết hồ sơ; cập nhật RBAC + hướng dẫn
- [x] Kiểm tra lại hiển thị sau khi đổi mã
## Đợt 2 – Chu kỳ báo cáo tháng (chờ)
## Đợt 3 – Hồ sơ cứng & ticket (đang làm)
- [x] Xem trước/in tem mã học viên và bảng kiểm từ phiếu kho hiện có, điều chỉnh màn hình nhỏ và khổ in A4
- [x] Kiểm tra trực tiếp bản xem trước tem/bảng kiểm ở chiều rộng 320, 375, 390, 768, 1024, 1280 và 1920 px (khung và nội dung không tràn ngang)
- [x] Tự thiết kế tem thương hiệu Kaizen có mã vạch và QR; xuất bảng kiểm Word từ dữ liệu hồ sơ hiện có
## Đợt 4 – Giáo dục định hướng (chờ)

## Kế hoạch hợp nhất — còn mở
- [ ] Phân lập dữ liệu và giao diện theo phòng ban/CTV, đồng bộ các luồng liên quan (đã lọc hồ sơ, kho, xuất cảnh, học bạ/báo cáo lớp và ghi danh; còn rà soát các luồng đào tạo khác và giao diện CTV)
- [ ] Mã định danh nhân sự/CTV và màn hình quản lý tập trung (đã cấp mã KZ-NV/KZ-CTV tự động trên hồ sơ hiện có, hiển thị mã; còn thiếu quản trị CTV ngoài hàng đợi và kiểm nghiệm đủ luồng)
- [ ] Tích hợp GDĐH vào lớp, chứng chỉ và bước xuất cảnh (đã thêm cảnh báo cho học viên dự kiến xuất cảnh có liên kết; chưa có học viên dự kiến để nghiệm thu trực tiếp; chỉ cảnh báo cho tới khi quy chuẩn được duyệt)
- [ ] Tự kiểm nghiệm độc lập, kiểm tra màn hình 320–1920px và biên bản bàn giao sau khi các luồng hoàn tất

## Cần người dùng cung cấp (biểu mẫu)
- [ ] Mẫu Excel báo cáo lao động/du học xuất cảnh hàng tháng
- [x] Mẫu checklist hồ sơ bản cứng (Word thương hiệu Kaizen tự tạo)
- [x] Mẫu ticket/tem xác nhận hoàn thành hồ sơ (tem tự thiết kế có mã vạch)
- [ ] Mẫu kế hoạch đào tạo định hướng trước xuất cảnh
- [x] Mẫu chứng chỉ giáo dục định hướng hiện có, tiếp tục chỉnh sửa được; đồng bộ số cấp thật với PDF

## Đợt bàn giao (10/2026)
- [x] Phân loại Du học / XKLĐ: ô chọn bắt buộc khi tạo hồ sơ + bộ lọc danh sách
- [x] Số chứng chỉ GDĐH tự cấp KZ-GDĐH-[thị trường]-[năm]-[5 số]
- [x] Trang Kiểm nghiệm & Bàn giao (/admin/kiem-nghiem): 5 nhóm, dữ liệu thử tự tạo/xóa, in biên bản A4
- [ ] Khai báo chương trình GDĐH thật (chờ Kaizen duyệt khung chương trình)
- [ ] Phân công 4 hồ sơ chưa rõ phòng ban (chờ Ban Giám đốc)
- [x] Tem mã vạch + QR và bảng kiểm Word mang thương hiệu Kaizen; người duyệt ngoại lệ GDĐH và người ký bàn giao chọn trong Tài khoản & Quyền
- [x] Quy trình nghiệp vụ từng bước cho 12 nhóm (/admin/huong-dan/quy-trinh), nút "Xem quy trình" trên các trang chính
- [ ] Xác nhận thời hạn xử lý từng bước và chính sách hoa hồng CTV (chờ Kaizen)

## Đợt 10/2026 — Nhân sự, trợ lý ảo, AI ngoài
- [x] Hoa hồng CTV theo đơn hàng giới thiệu (nhập mã CTV khi tạo hồ sơ, trang /admin/hoa-hong)
- [x] Cổng AI ngoài nhiều hãng (OpenAI/Gemini/Claude) chọn tại /admin/cai-dat-ai; chuyển toàn bộ tính năng AI cũ sang khoá riêng
- [x] Trợ lý ảo nội bộ trên mọi trang quản trị: hướng dẫn, tra cứu theo phạm vi phòng ban, soạn thảo
- [ ] Nhập khoá API của Kaizen (chờ người dùng)
- [x] Quản trị nhân sự: gom phòng ban/chức danh vào module nhân sự, danh sách nhân sự & CTV tập trung
- [x] Hợp đồng lao động (cảnh báo hết hạn)
- [x] Nghỉ phép & chấm công
- [x] Lương & KPI
- [x] Cổng riêng cho CTV (gửi ứng viên, xem hoa hồng)

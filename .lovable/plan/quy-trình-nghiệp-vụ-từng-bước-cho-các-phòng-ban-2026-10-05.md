# Quy trình nghiệp vụ từng bước cho các phòng ban

## Mini-PRD
1. Mục tiêu: nhân sự mới tự làm đúng việc theo từng bước, không phải hỏi lại; giảm thao tác sai.
2. Đối tượng: cán bộ các phòng ban, giáo viên, cộng tác viên.
3. Lối vào chính: mục "Quy trình nghiệp vụ" trong trang Hướng dẫn, kèm nút "Xem quy trình" ở đầu các màn hình chính.
4. Nội dung: mỗi quy trình chia thành các bước có số thứ tự, mỗi bước ghi rõ ai làm, làm ở đâu (nút mở đúng màn hình), cần gì, thế nào là xong, lỗi hay gặp.
5. Tìm kiếm: trang nội bộ, không hiện trên Google.
6. Đo kết quả: mỗi phòng ban có ít nhất 1 quy trình đầy đủ; người dùng đánh dấu hoàn thành được từng bước.
7. Trường hợp đặc biệt: xem trên điện thoại (từ 320px), in ra giấy A4, người chỉ có 1 vai trò thì chỉ thấy quy trình của mình.
8. Hoàn tác: ẩn mục khỏi menu; các bài hướng dẫn hiện có không bị ảnh hưởng.

## Người dùng sẽ thấy gì

```text
Hướng dẫn  >  Quy trình nghiệp vụ
 [Phòng ban: Tất cả v]  [Tìm quy trình...]
 ┌ Tiếp nhận và tạo hồ sơ học viên XKLĐ   7 bước · Tư vấn/CSKH
 ├ Cấp chứng chỉ Giáo dục định hướng      6 bước · Đào tạo
 └ ...
Trang chi tiết:
 Bước 2/7  Kiểm tra trùng hồ sơ
   Ai làm: Tư vấn viên       Làm ở đâu: [Mở Hồ sơ học viên]
   Cần chuẩn bị: CCCD, số điện thoại
   Thao tác: 1... 2... 3...
   Xong khi: hệ thống báo "Không trùng"
   Lỗi hay gặp: ...                [x] Tôi đã làm xong bước này
 Thanh tiến độ: 2/7 bước   [In quy trình]
```

## Danh sách quy trình (dựa trên các chức năng đã có)

| Phòng ban | Quy trình |
|---|---|
| Marketing | Đăng bài chuẩn SEO; tạo chiến dịch có mã theo dõi nguồn (UTM) và đọc báo cáo |
| Sale / Telesales | Nhận khách, gọi, cập nhật trạng thái tới "Hoàn tất" hoặc "Khách bỏ", chuyển thành hồ sơ |
| Cộng tác viên | Giới thiệu ứng viên, theo dõi tiến độ hồ sơ |
| Tư vấn / CSKH | Tạo hồ sơ Du học; tạo hồ sơ XKLĐ (chọn loại hồ sơ, đọc CCCD tự động, kiểm tra trùng, phòng ban) |
| Hồ sơ / Kho | Tiếp nhận giấy tờ gốc, xếp vị trí tủ, in tem mã vạch và bảng kiểm Word |
| Đào tạo | Mở lớp, xếp lịch, phân công giáo viên; lớp Giáo dục định hướng tới sát hạch và cấp chứng chỉ |
| Giáo viên | Điểm danh QR, nhập điểm, nhận xét định kỳ, trình chiếu lớp |
| Visa / Xuất cảnh | Hoàn thiện bảng kiểm, nộp visa, cập nhật kết quả, xác nhận xuất cảnh (lưu ý cảnh báo thiếu Giáo dục định hướng) |
| Hành chính nhân sự | Tạo tài khoản, cấp mã nhân sự/CTV, gán phòng ban và quyền |
| Ban Giám đốc | Duyệt phân công hồ sơ chưa có phòng ban, xem báo cáo, chạy kiểm nghiệm và in biên bản bàn giao |
| Liên phòng | Hành trình trọn vẹn một học viên: từ lúc là khách tiềm năng tới khi xuất cảnh, từng bước chuyển giao giữa các phòng |

Nội dung được viết theo đúng màn hình và tên nút hiện có. Phần nào cần Kaizen xác nhận (ví dụ thời hạn xử lý từng bước) sẽ được đánh dấu "chờ Kaizen xác nhận".

## Thứ tự thực hiện
1. Dựng khung trang danh sách và trang chi tiết quy trình, thanh tiến độ, nút in.
2. Viết nội dung cho 11 nhóm trên, đối chiếu từng tên nút và đường dẫn với hệ thống thật.
3. Thêm nút "Xem quy trình" ở đầu các màn hình chính.
4. Tự kiểm tra: mọi nút "Làm ở đâu" mở đúng trang; mỗi vai trò chỉ thấy quy trình của mình; hiển thị 320–1920px; bản in A4.
5. Cập nhật hướng dẫn và danh sách việc cần làm.

## Chi tiết kỹ thuật
- Nội dung là dữ liệu tĩnh trong mã nguồn (file mới `src/lib/help/workflows.ts`) có kiểu `Workflow { slug, title, department, permissions, steps: { title, actor, link, prepare, actions[], doneWhen, issues[] }[] }`. Không tạo bảng mới.
- Tiến độ "đã làm xong" lưu trên trình duyệt của từng người (chỉ để tự theo dõi, không phải bản ghi phê duyệt).
- Route mới: `/admin/huong-dan/quy-trinh` và `/admin/huong-dan/quy-trinh/$slug`, có head() riêng và `noindex`. Lọc theo quyền qua `useMyAccess`. Đăng ký vào danh mục phân quyền theo quy tắc trang admin mới.
- Bài kiểm tra tự động: mọi `link` trong quy trình phải trùng một trang có thật; mọi quy trình phải có quyền.

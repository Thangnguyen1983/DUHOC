# Đánh giá hệ thống Kaizen theo đặc tả mới + Lộ trình hoàn thiện

## 1. Hiện trạng so với đặc tả

| Nhóm chức năng | Trạng thái | Ghi chú |
|---|---|---|
| Website + CMS (bài viết, chuyên mục, SEO, AI viết bài) | Đã có | Thiếu tạo ảnh bằng AI ngay trong trình soạn thảo |
| Trang ngoài / trang nội dung | Đã có | Nhiều trang tĩnh + CMS landing template |
| Landing Page chiến dịch | Thiếu | Chưa có trình tạo landing theo chiến dịch, chưa gắn UTM, chưa đo hiệu quả từng campaign |
| Danh mục ngoại ngữ | Bán phần | Đang khai báo cứng trong mã, chưa quản trị được |
| Danh mục giáo viên | Bán phần | Có hồ sơ giáo viên nhưng chưa upload CV / bằng cấp / chứng chỉ |
| Danh mục chương trình đào tạo, hồ sơ, người dùng | Đã có | |
| Điểm danh (QR, có mặt/vắng/muộn/phép) | Đã có | Thiếu cơ chế nhắc nhở – kỷ luật – khen thưởng |
| Chất lượng đào tạo (điểm KT, điểm thi, theo giai đoạn) | Đã có | Bảng điểm có loại đánh giá + trọng số |
| Nhận xét tuần/tháng/giai đoạn/kết thúc khoá | Thiếu | Chưa có bảng nhận xét định kỳ của giáo viên |
| Thống kê – biểu đồ | Bán phần | Có KPI dạng bảng ở Giám sát lớp; chưa có biểu đồ theo lớp/GV/chương trình |
| Phân quyền theo vị trí | Bán phần | Đã có RBAC 26 quyền; thiếu vai trò Trưởng thị trường và giới hạn "chỉ xem học viên mình phụ trách" |
| Telesales phân phối lead tự động | Thiếu | Lead từ chatbot/biểu mẫu đã lưu, nhưng chưa có gán tự động, nhận lead, hết hạn chuyển người khác |
| E-Learning: bài học video/tài liệu/bài tập, tiến độ, quiz nhiều lần | Đã có | |
| Nguồn học liệu miễn phí (tối thiểu 1 link/bài) | Thiếu | |
| Đánh giá mức độ hoàn thành bài học (thời lượng học + điểm + AI) | Thiếu | Mới có đánh dấu hoàn thành thủ công |
| Hồ sơ du học: lưu trữ, xác minh tài liệu | Đã có | |
| Checklist hồ sơ theo thị trường (bắt buộc/không bắt buộc) | Thiếu | Loại giấy tờ chưa có danh mục cấu hình theo quốc gia |
| Tiến độ hồ sơ realtime + % hoàn thiện | Thiếu | |
| AI kiểm tra tính đầy đủ – logic – bất thường của hồ sơ | Thiếu | |
| Thống kê visa (đạt/trượt theo kỳ, thị trường, cán bộ) | Thiếu | Có trường visa_status nhưng chưa có báo cáo |

## 2. Lộ trình đề xuất (6 giai đoạn)

**GĐ1 – Nền tảng danh mục & phân quyền**
- Bảng danh mục dùng chung: ngoại ngữ, loại hồ sơ theo thị trường, giai đoạn đào tạo.
- Hồ sơ giáo viên: upload CV, bằng cấp, chứng chỉ (lưu trong kho tệp riêng, chỉ quản trị/tổ chuyên môn xem).
- Thêm vai trò `market_head` (Trưởng thị trường); giới hạn dữ liệu theo `assigned_to` cho CSKH/tuyển dụng.

**GĐ2 – Hồ sơ du học chuẩn hoá**
- Checklist hồ sơ theo từng thị trường (bắt buộc/không bắt buộc), sinh tự động khi tạo hồ sơ.
- Màn hình tiến độ hồ sơ: đã có / thiếu / đang xử lý / cần bổ sung, % hoàn thiện, cập nhật realtime.
- Dashboard visa: tỷ lệ đạt/trượt theo kỳ nhập học, thị trường, cán bộ phụ trách; thời gian xử lý.

**GĐ3 – Telesales & phân phối lead**
- Hàng đợi lead, gán tự động luân phiên, nút "Nhận khách", khoá lead khi đã có người nhận.
- Hết thời gian quy định tự chuyển sang sales khác; nhật ký phân phối.
- Chốt khách → chuyển thành học viên trung tâm hoặc du học sinh (tạo hồ sơ tương ứng).

**GĐ4 – Quản lý trung tâm nâng cao**
- Nhận xét định kỳ: tuần / tháng / giai đoạn / kết thúc khoá, có tiêu chí chấm điểm.
- Nhắc nhở – kỷ luật – khen thưởng gắn với dữ liệu điểm danh (tự động cảnh báo khi vắng quá ngưỡng).
- Trang thống kê có biểu đồ: theo lớp, giáo viên, chương trình, kết quả học tập.

**GĐ5 – E-Learning thông minh**
- Trường "nguồn học liệu miễn phí" cho mỗi bài học (bắt buộc ≥1 link), có gợi ý bằng AI, giáo viên duyệt/sửa.
- Chấm mức độ hoàn thành bài học theo thời lượng xem + điểm quiz + bài tập, tổng hợp tiến độ chương trình.
- Ngân hàng đề: kiểm tra tuần/tháng/giai đoạn, đề luyện chứng chỉ, cho làm lại nhiều lần.

**GĐ6 – AI & Marketing**
- Tạo ảnh bằng AI trong CMS.
- Trình tạo Landing Page chiến dịch + gắn UTM + báo cáo lead theo chiến dịch.
- AI rà soát hồ sơ du học: đầy đủ, thống nhất thông tin giữa giấy tờ, cảnh báo trước khi nộp.
- Dashboard tổng hợp toàn hành trình Marketing → Lead → Học viên → Hồ sơ → Visa → Xuất cảnh.

## 3. Ghi chú kỹ thuật
- Mỗi bảng mới tạo trong cơ sở dữ liệu đều kèm phân quyền hàng (RLS) theo vai trò và theo cán bộ phụ trách.
- Tài liệu giáo viên và hồ sơ học viên dùng kho tệp riêng tư, truy cập qua liên kết có hạn thời gian.
- Tiến độ realtime dùng kênh realtime của backend cho bảng hồ sơ và checklist.
- Các tính năng AI (gợi ý học liệu, chấm hoàn thành, rà soát hồ sơ, tạo ảnh) dùng cổng AI sẵn có của nền tảng.
- Nhật ký thao tác cho các hành động nhạy cảm: nhận lead, đổi trạng thái hồ sơ, kỷ luật/khen thưởng.

## 4. Bước tiếp theo
Triển khai GĐ1 trước (danh mục + hồ sơ giáo viên + vai trò Trưởng thị trường + giới hạn dữ liệu theo người phụ trách), sau đó lần lượt các giai đoạn còn lại. Có thể đổi thứ tự ưu tiên theo yêu cầu.

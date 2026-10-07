# Bộ chuyển nhanh 3 cổng cho Admin

## Mục tiêu

Tạo một menu tài khoản thống nhất để Admin chuyển nhanh giữa:

- Cổng quản trị
- Cổng giáo viên
- Cổng học viên

Hỗ trợ đồng thời hai cách sử dụng:

1. **Mở cổng theo quyền thật**: giữ nguyên tài khoản, phiên đăng nhập và quyền hiện có.
2. **Xem thử giao diện theo vai trò**: Admin xem dữ liệu tổng hợp mẫu ở chế độ chỉ đọc, không giả mạo tài khoản và không thay đổi dữ liệu thật.

## Phạm vi thực hiện

### 1. Menu tài khoản dùng chung

- Tạo một bộ chuyển cổng dùng chung và đặt trong menu tài khoản của cả ba khu vực.
- Menu hiển thị email, vai trò hiện tại, cổng đang mở và ba lối chuyển cổng bằng biểu tượng rõ ràng.
- Trên điện thoại, menu vẫn dễ bấm và không làm tràn màn hình.
- Dùng liên kết điều hướng nội bộ để giữ tốc độ chuyển trang và lịch sử trình duyệt.

### 2. Chuyển cổng theo quyền thật

- **Cổng quản trị**: chỉ mở khi tài khoản có quyền quản trị tương ứng.
- **Cổng giáo viên**: dùng đúng cơ chế hiện có; Admin tiếp tục được xem với tư cách nhân sự quản lý đào tạo.
- **Cổng học viên**: chỉ mở dữ liệu cá nhân thật khi tài khoản thực sự có vai trò/hồ sơ học viên hoặc giáo viên phù hợp.
- Nếu tài khoản không có quyền thật, menu giải thích ngắn gọn và cung cấp nút **Xem thử** thay vì tự cấp vai trò.
- Không sửa bảng vai trò, không tự gán quyền và không đổi phiên đăng nhập khi chuyển cổng.

### 3. Chế độ xem thử đúng vai trò

- Bổ sung chế độ xem thử cho Cổng giáo viên và Cổng học viên, chỉ Admin mới bật được.
- Hiển thị dữ liệu tổng hợp mẫu, không gắn với một giáo viên hoặc học viên thật.
- Có dải cảnh báo cố định “Đang xem thử — dữ liệu mẫu, chỉ đọc” và nút quay lại Cổng quản trị.
- Ẩn hoặc khóa toàn bộ thao tác ghi dữ liệu như điểm danh, chấm điểm, cập nhật hồ sơ, làm bài và gửi biểu mẫu.
- Điều hướng bên trong cổng giữ nguyên trạng thái xem thử để không vô tình chuyển sang dữ liệu thật.

### 4. Đồng nhất trải nghiệm và bảo mật

- Dùng một nguồn kiểm tra vai trò/quyền chung, tránh tiếp tục nhân bản danh sách vai trò giữa Cổng giáo viên và Cổng học viên.
- Kiểm tra quyền xem thử ở phía máy chủ; tham số trên đường dẫn không đủ để tự mở chế độ này.
- Không để chế độ xem thử làm thay đổi quyền thật hoặc nới quyền của các chức năng phía máy chủ.
- Giữ nguyên các luồng dữ liệu, hồ sơ, lớp học, điểm danh và phân quyền hiện tại.

### 5. Hướng dẫn và kiểm thử

- Cập nhật hướng dẫn “Bắt đầu nhanh” với cách chuyển cổng, phân biệt quyền thật và xem thử.
- Kiểm thử Admin chuyển đủ ba cổng trên máy tính và điện thoại.
- Kiểm thử người không phải Admin không thấy và không thể mở chế độ xem thử bằng đường dẫn trực tiếp.
- Kiểm thử chế độ xem thử không thể thực hiện thao tác ghi dữ liệu.
- Kiểm tra các đường dẫn cũ, đăng xuất, quay lại và trạng thái menu vẫn hoạt động bình thường.

## Chi tiết kỹ thuật

- Tái sử dụng các cổng hiện có tại `/admin`, `/giang-day` và `/hoc-vien`; không tạo cổng hoặc bảng dữ liệu trùng lặp.
- Tách bộ chuyển cổng thành thành phần dùng chung cho ba bố cục hiện tại.
- Dùng tham số tìm kiếm đã kiểm tra kiểu cho chế độ xem thử và duy trì tham số này trên các liên kết con.
- Dữ liệu mẫu được tạo riêng cho giao diện xem thử, không đọc thông tin cá nhân của tài khoản khác và không gọi các thao tác cập nhật.

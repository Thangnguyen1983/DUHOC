# Làm nổi bật menu quản trị: chữ đậm rõ + icon màu 3D

## Mục tiêu
Thanh menu bên trái của trang quản trị hiện đang nhạt: chữ nhóm nhỏ, màu xám mờ, icon đơn sắc đen. Sẽ chỉnh lại cho chữ đậm, rõ nét hơn và mỗi mục có icon màu riêng dạng "khối 3D" nhỏ để menu sinh động, dễ nhận biết.

## Sẽ thay đổi

### 1. Chữ trên menu
- Mục chính (Dashboard, Lead, Chiến dịch marketing, Hướng dẫn): chữ to hơn một bậc, in đậm vừa (semibold), màu chữ đậm rõ thay cho xám nhạt.
- Tên nhóm (NỘI DUNG WEBSITE, VẬN HÀNH & ĐÀO TẠO, CHATBOT, E-LEARNING, HỆ THỐNG): giữ chữ hoa nhưng tăng độ đậm và độ tương phản, không còn xám mờ.
- Mục con trong nhóm: chữ rõ hơn, khi đang ở trang đó thì nền nhấn + chữ đỏ thương hiệu + in đậm, có thanh chỉ dấu nhỏ bên trái.
- Tất cả đảm bảo độ tương phản đọc tốt và vẫn hoạt động ở chế độ tối.

### 2. Icon màu, cảm giác 3D
- Mỗi mục có một "viên" icon vuông bo tròn 28px: nền chuyển sắc nhẹ theo màu chủ đề của mục, viền sáng phía trên, bóng đổ mềm phía dưới — tạo cảm giác nổi khối.
- Bảng màu theo nhóm chức năng, ví dụ: Dashboard (đỏ thương hiệu), Lead (hổ phách), Marketing (hồng/tím), Nội dung website (lam), Vận hành & Đào tạo (lục), Chatbot (chàm), E-learning (cam), Hệ thống (xám đá), Hướng dẫn (ngọc).
- Khi rê chuột: viên icon nhấc nhẹ và sáng lên; khi đang ở trang đó: viên icon đậm màu hơn.
- Icon vẫn dùng bộ icon sẵn có, chỉ đổi cách trình bày — không thêm ảnh nặng.

### 3. Phạm vi
- Chỉ chỉnh giao diện thanh menu quản trị và các biến màu bổ sung trong tệp style chung.
- Không đổi cấu trúc menu, không đổi quyền truy cập, không đụng dữ liệu hay chức năng.
- Menu trên điện thoại và bản in giữ nguyên hành vi hiện tại.

## Chi tiết kỹ thuật
- Sửa `src/routes/_authenticated/route.tsx`: thêm prop `tone` cho `NavItem`/`NavGroup`, bọc icon trong một `span` có gradient + `ring` + `shadow`, tăng `font-weight`/`text-size`, cập nhật `activeProps`.
- Thêm token màu tone (đỏ, hổ phách, lam, lục, chàm, cam, xám, ngọc) dưới dạng lớp tiện ích trong `src/styles.css`, dùng biến oklch, có biến thể cho chế độ tối. Không hardcode `bg-white`/`text-black`.
- Kiểm tra lại bằng ảnh chụp giao diện ở 1280px và 360px sau khi làm.
- Theo quy ước dự án: cập nhật bài hướng dẫn liên quan trong `src/lib/help/guides.ts` nếu cách đọc menu thay đổi (chỉ mô tả màu nhóm).

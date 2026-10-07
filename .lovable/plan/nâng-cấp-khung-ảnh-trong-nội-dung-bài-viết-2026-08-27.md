# Nâng cấp khung ảnh trong nội dung bài viết

Hiện ảnh chèn trong bài chỉ là thẻ ảnh trơn: bo góc nhẹ, không khung, không chú thích nổi bật, không hiệu ứng khi rê chuột hay khi cuộn tới, bấm vào không phóng to.

## Mục tiêu
1. Mục tiêu: tăng thời gian đọc và độ chuyên nghiệp của bài viết (blog, câu chuyện học viên, trang trường đối tác).
2. Đối tượng: học sinh/phụ huynh đọc bài trên di động là chính.
3. CTA chính: giữ nguyên CTA hiện có ở cuối bài — thay đổi này chỉ về trình bày.
4. Nội dung chính: khung ảnh có viền + bóng đổ, chú thích ảnh rõ ràng, phóng to khi bấm.
5. SEO: giữ nguyên thẻ `figure/figcaption`, `alt`, `loading="lazy"` — không đổi nội dung.
6. Success metric: ảnh hiển thị đồng nhất trên mọi bài, không lỗi vỡ khung trên mobile.
7. Edge case: ảnh lỗi/không tải được, ảnh dọc, ảnh nhỏ, không JavaScript, đọc bằng trình đọc màn hình.
8. Rollback: gỡ component khung ảnh, quay lại thẻ ảnh mặc định (thay đổi khu trú trong 1 component + 3 trang bài).

## Những gì sẽ làm

**Khung ảnh chuẩn (component dùng chung)**
- Bọc ảnh trong khung bo góc lớn, viền mảnh, bóng đổ nhẹ, nền xám khi ảnh đang tải.
- Tỷ lệ thoáng, ảnh dọc tự canh giữa và giới hạn chiều cao để không chiếm cả màn hình.
- Chú thích lấy từ `alt`/`title` hiển thị dưới ảnh dạng chữ nhỏ, canh giữa, màu phụ.

**Hiệu ứng**
- Ảnh mờ dần hiện lên khi cuộn tới (fade-in), không giật layout.
- Rê chuột: ảnh phóng nhẹ trong khung, bóng đổ đậm hơn (chỉ trên máy tính).
- Bấm vào ảnh: mở lớp xem toàn màn hình (lightbox) nền tối, có nút đóng, đóng bằng phím Esc hoặc bấm nền; nhiều ảnh trong bài có thể chuyển trái/phải.
- Tôn trọng thiết lập "giảm chuyển động" của hệ điều hành: tắt hiệu ứng khi người dùng bật.

**Nhóm ảnh liền nhau**
- Hai hoặc ba ảnh đứng liền nhau trong bài sẽ tự xếp lưới 2 cột trên máy tính, 1 cột trên di động, cùng mở chung lightbox.

**Phạm vi áp dụng**
- Trang tin tức/bài viết, câu chuyện học viên, trang trường đối tác — dùng chung một component nên hiển thị đồng nhất.
- Ảnh bìa đầu bài giữ nguyên bố cục hiện tại.

## Chi tiết kỹ thuật
- Component mới `src/components/content/article-figure.tsx` + `article-lightbox.tsx`, dùng token màu trong `src/styles.css` (không hardcode màu), animation dùng lớp `animate-fade-in` và `IntersectionObserver` qua hook `use-in-view` đã có.
- Thay `components.img` của ReactMarkdown trong `src/routes/tin-tuc.$slug.tsx`, `src/routes/cau-chuyen.$slug.tsx`, `src/routes/doi-tac.truong.$slug.tsx` bằng component mới; với nhánh HTML thuần (`dangerouslySetInnerHTML`) thêm lớp CSS `.article-body img` trong `src/styles.css` để có cùng khung/bóng đổ và gắn lightbox bằng event delegation.
- Lightbox tự viết bằng `Dialog` của shadcn đã có, không thêm thư viện mới; ảnh trong lightbox tải `loading="eager"`.
- Ảnh lỗi: hiện khung giữ chỗ với chữ "Không tải được ảnh" thay vì icon vỡ.
- Giữ nguyên `alt`, thứ tự DOM và `figure/figcaption` để không ảnh hưởng SEO.

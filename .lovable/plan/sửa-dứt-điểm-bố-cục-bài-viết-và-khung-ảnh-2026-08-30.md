# Sửa dứt điểm bố cục bài viết và khung ảnh

## Nguyên nhân (đã kiểm chứng)

Bài `/tin-tuc/chuc-mung-hoc-vien-kaizen-nhan-visa-du-hoc-han-quoc` lưu nội dung dạng HTML thuần (các khối `<figure><img ...></figure>`), nên trang không đi qua component khung ảnh mới mà rơi vào nhánh `dangerouslySetInnerHTML` chỉ được tạo dáng bằng CSS `.article-body img` trong `src/styles.css`.

Ba lỗi hiển thị bắt nguồn từ đó:

1. **Ảnh bị cắt xén**: CSS đang đặt `object-fit: cover` + `max-height: 560px`. Ảnh giấy tờ (visa, hộ chiếu) dạng dọc bị cắt mất đầu và chân trang — đúng như ảnh visa trong bài đang mất phần trên/dưới.
2. **Ảnh dính/chồng nhau**: khối `<figure>` do CMS sinh ra không có khoảng cách trên dưới, 6 ảnh xếp liền nhau thành một dải liền mạch, không có chú thích phân tách.
3. **Không đồng nhất**: nhánh HTML không có lightbox chuẩn, không có hiệu ứng, chú thích lấy từ `alt` là tên file (`z8199331971264_....webp`) nên nhìn rất xấu nếu bật.

## Cách xử lý (áp dụng cho toàn hệ thống)

**1. Đưa mọi bài viết về cùng một đường render**
- Nội dung HTML thuần sẽ được chuyển đổi sang cùng component khung ảnh với nhánh Markdown, thay vì đổ HTML thô. Kết quả: mọi bài — dù soạn bằng Markdown hay dán HTML — đều dùng chung một khung ảnh, một lightbox, một kiểu chú thích.
- Gỡ lớp `<figure>` lồng nhau do CMS sinh ra để không còn khung trong khung.

**2. Chuẩn hoá khung ảnh**
- Không cắt xén ảnh nữa: ảnh hiển thị trọn vẹn, canh giữa, nền xám nhạt hai bên khi ảnh dọc; giới hạn chiều cao ~70% màn hình để ảnh dọc không chiếm hết trang.
- Khoảng cách rõ ràng giữa các ảnh, bo góc, viền mảnh, bóng đổ nhẹ.
- Chú thích: chỉ hiện khi `alt`/`title` là câu chữ có nghĩa; tên file (kiểu `z8199...webp`, `IMG_1234.jpg`) sẽ bị bỏ qua và dùng làm `alt` ẩn cho SEO/trình đọc màn hình.

**3. Bố cục nhiều ảnh liền nhau**
- Từ 2 ảnh trở lên đứng liền nhau sẽ tự xếp lưới: 2 cột trên máy tính, 1 cột trên di động; các ảnh trong lưới cùng tỷ lệ nên nhìn gọn thay vì một dải dài 6 ảnh.
- Bấm ảnh mở lightbox toàn màn hình, chuyển trái/phải, đóng bằng Esc — dùng chung cho cả bài.

**4. Bố cục chữ**
- Giới hạn bề rộng dòng chữ để dễ đọc, thống nhất khoảng cách đoạn/tiêu đề giữa 3 loại trang bài viết.
- Trên di động: ảnh tràn viền mềm, không tràn ngang gây trượt trang.

**5. Phạm vi**
- Áp dụng cho tin tức, câu chuyện học viên, trang trường đối tác và khung xem trước trong CMS — cùng một component nên hiển thị giống nhau ở mọi nơi.
- Không sửa nội dung bài viết trong cơ sở dữ liệu; chỉ đổi cách hiển thị.

## Chi tiết kỹ thuật

- `src/lib/blog-seo.ts` / route: bỏ nhánh `dangerouslySetInnerHTML`, luôn render qua `ReactMarkdown` với `rehypeRaw` (HTML thuần vẫn parse đúng), giữ nguyên `remarkGfm`, `remarkBreaks`, `rehypeSlug` và cấu hình sanitize hiện có (chuyển sang `rehype-sanitize` tương đương danh sách thẻ đang dùng).
- `src/components/content/article-media.tsx`:
  - thêm `components.figure` để unwrap `<figure>` chỉ chứa ảnh (+ `figcaption`) thành `ArticleFigure`, tránh figure lồng figure;
  - `ArticleFigure`: `object-contain`, `max-h-[70vh]`, nền `bg-muted`, `aspect` tự nhiên, khoảng cách `my-8`;
  - hàm `isFileNameCaption()` lọc chú thích dạng tên file;
  - `ArticleParagraph`/gom nhóm: gom các figure liền kề (kể cả từ HTML) vào `ArticleFigureGrid`.
- `src/styles.css`: sửa `.article-body img` từ `object-fit: cover` → `contain`, thêm `margin-block`, giữ token màu (không hardcode).
- Cập nhật `src/routes/tin-tuc.$slug.tsx`, `src/routes/cau-chuyen.$slug.tsx`, `src/routes/doi-tac.truong.$slug.tsx`, `src/components/cms/content-preview.tsx` dùng chung cấu hình.
- Kiểm chứng bằng Playwright trên bài visa Hàn Quốc ở 1280px và 390px: ảnh không bị cắt, không chồng lấn, không trượt ngang.

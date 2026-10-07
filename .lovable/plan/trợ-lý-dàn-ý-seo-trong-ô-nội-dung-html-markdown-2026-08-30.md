# Trợ lý dàn ý SEO trong ô "Nội dung (HTML/Markdown)"

Mục tiêu: ngay tại khu vực soạn nội dung, admin thấy **cấu trúc mục lục (H2/H3) hiện tại**, được **gợi ý dàn ý chuẩn SEO** theo từ khoá chính, và có thể **sắp xếp lại / sửa / chèn** mục chỉ bằng vài cú nhấp.

## Chức năng

### 1. Tab "Dàn ý SEO" (cạnh tab Soạn thảo / Xem trước)
- Liệt kê mọi H2/H3 đang có trong bài, theo đúng thứ tự.
- Kéo–thả để **sắp xếp lại thứ tự mục**; toàn bộ đoạn văn thuộc mục đó di chuyển theo.
- Nút nâng/hạ cấp (H2 ↔ H3), đổi tên tiêu đề tại chỗ, xoá mục, chèn mục mới.
- Mọi thay đổi ghi thẳng vào `data.body`, giữ nguyên chữ tiếng Việt có dấu và ảnh/video đã chèn.

### 2. Bảng chấm điểm SEO on-page (hiển thị trực tiếp dưới ô nội dung)
Kiểm tra tự động, mỗi mục có trạng thái đạt / cảnh báo:
- Đúng 1 H1 (hoặc không có H1 trong body vì tiêu đề bài đã là H1).
- Số lượng H2 ≥ 3, không nhảy cấp (H2 → H4).
- Từ khoá chính xuất hiện ở H1, ít nhất 1 H2, và trong 100 từ đầu.
- Độ dài bài (cảnh báo nếu < 800 từ), độ dài đoạn văn quá dài.
- Mọi ảnh có alt mô tả (không phải tên file).
- Có ≥ 2 liên kết nội bộ, có phần FAQ, có đoạn kết + CTA.

### 3. Gợi ý dàn ý bằng AI
- Ô nhập từ khoá chính + ý định tìm kiếm → nút "Gợi ý dàn ý".
- Trả về danh sách H2/H3 đề xuất (tiếng Việt có dấu, đúng lĩnh vực du học / XKLĐ), kèm gợi ý FAQ.
- Với mỗi mục gợi ý: **Chèn** (thêm vào cuối / tại con trỏ) hoặc **Chèn tất cả**. Không tự ghi đè nội dung đang có.
- Nút "Sắp xếp lại theo dàn ý gợi ý": khớp mục hiện có với dàn ý chuẩn rồi đổi thứ tự, mục không khớp giữ nguyên ở cuối — luôn có xem trước thay đổi và nút Hoàn tác.

### 4. Chuẩn hoá nhanh
Nút "Chuẩn hoá cấu trúc" áp dụng bộ chuẩn hoá markdown sẵn có cho nội dung đang soạn (dòng VIẾT HOA/emoji → H2, liệt kê sau dấu ":" → bullet), có xem trước trước khi ghi đè.

## Kỹ thuật

- Không đổi schema, không đổi `upsertEntry`; chỉ thao tác trên chuỗi `data.body`.
- Thêm `src/lib/cms/outline.ts`: phân tích body thành các khối `{ level, title, content }` (hỗ trợ cả markdown `##` và HTML `<h2>`), và hàm ghép ngược lại chuỗi.
- Thêm `src/lib/cms/seo-audit.ts`: các luật chấm điểm on-page nêu trên, dùng lại `wordCount`/`extractToc`/`extractFaq` trong `src/lib/blog-seo.ts`.
- Thêm `src/components/cms/outline-panel.tsx` (danh sách + kéo thả) và `src/components/cms/seo-score-panel.tsx`; gắn vào `src/components/cms/entry-form.tsx` cạnh `ContentPreview`.
- Gợi ý AI dùng lại luồng AI Writer hiện có (`src/routes/api/ai-writer.ts`) với chế độ `outline`, trả JSON dàn ý — không thêm khoá API mới.
- Kéo thả dùng thư viện dnd đã có trong dự án nếu sẵn; nếu chưa có thì dùng nút Lên/Xuống để tránh cài thêm phụ thuộc.

## Kiểm chứng

Mở `/admin/cms/post/new` và một bài đã có nội dung dài: kiểm tra dàn ý liệt kê đúng H2/H3, đổi thứ tự giữ nguyên nội dung và ảnh, bảng điểm SEO phản ánh đúng lỗi, gợi ý AI chèn được mục, và tab Xem trước hiển thị đúng.

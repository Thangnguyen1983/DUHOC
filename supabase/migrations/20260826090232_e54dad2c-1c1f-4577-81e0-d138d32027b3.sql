
DO $mig$
DECLARE
  b text;
  imgs text[];
BEGIN
  UPDATE public.cms_entries e
  SET title = 'Học nghề Đức: Áp lực tâm lý của Azubi đáng lo hơn bạn nghĩ',
      seo = jsonb_build_object(
        'meta_title', 'Áp lực học nghề Đức: Azubi 2026 đối mặt điều gì? | Kaizen',
        'meta_description', 'DGB-Ausbildungsreport 2026: 50,6% Azubi tại Đức chịu áp lực tâm lý. Hiểu đúng áp lực du học nghề Đức trước khi đi. Đăng ký tư vấn miễn phí cùng Kaizen.',
        'og_title', 'Áp lực học nghề Đức: Azubi 2026 đối mặt điều gì?',
        'og_description', 'Số liệu DGB 2026 về áp lực tâm lý, tài chính và nhà ở của Azubi tại Đức, cùng lời khuyên chuẩn bị từ Kaizen.',
        'og_image', coalesce(e.cover_image, '')
      ),
      data = jsonb_set(e.data, '{body}', to_jsonb($body1$## Azubi tại Đức đang chịu những áp lực nào?

Báo cáo **DGB-Ausbildungsreport 2026**, công bố ngày 20/8/2026, khảo sát 13.227 Azubi tại Đức cho thấy:

- **50,6%** Azubi cho biết đang chịu **áp lực tâm lý**.
- Chỉ **65,7%** hài lòng hoặc rất hài lòng với Ausbildung, mức thấp nhất kể từ năm 2006.
- **49,9%** cảm thấy áp lực vì tình hình tài chính.
- **35%** chịu áp lực vì vấn đề nhà ở.
- **65,3%** cho biết trợ cấp học nghề khó hoặc không đủ để tự trang trải cuộc sống.
- **35,4%** thường xuyên làm thêm giờ, trung bình khoảng **3,2 giờ/tuần**.

Và một áp lực ít được nhắc đến: **37,1% Azubi năm cuối vẫn chưa biết mình có được doanh nghiệp tiếp nhận sau khi tốt nghiệp hay không.**

## Trợ cấp Ausbildung có đủ sống không?

Theo **BIBB, Viện Giáo dục và Đào tạo nghề Liên bang Đức**, năm 2025 mức trợ cấp đào tạo bình quân tại các doanh nghiệp có thỏa ước tập thể đạt **1.209 € brutto/tháng**. Nhưng tiền thuê nhà và chi phí sinh hoạt khiến **65,3% Azubi vẫn không thể tự sống bằng khoản tiền này**.

## Với người Việt sang Đức, áp lực còn lớn hơn

Ngoài công việc và Berufsschule, du học sinh nghề Đức còn đối mặt với tiếng Đức, khác biệt văn hóa, tự lập, tiền nhà, xa gia đình và áp lực phải thành công.

Vì vậy, trước khi hỏi “Con học có tốt không?”, hãy thử hỏi: **“Dạo này con có ổn không?”**

## Chuẩn bị thế nào để đi đường dài?

Học được một nghề là mục tiêu quan trọng. Nhưng đủ sức khỏe tinh thần để đi hết 2 đến 3 năm Ausbildung mới là điều quyết định. Nếu chuẩn bị đúng, hiểu rõ áp lực và có hệ thống hỗ trợ tốt, đây vẫn là lựa chọn rất đáng giá.

Tại Kaizen, bạn được học tiếng Đức tới B1 và B2, rèn kỹ năng sống tự lập và có đội ngũ đồng hành trong suốt thời gian tại Đức.

## Tìm hiểu thêm

- [Chương trình du học nghề Đức](/du-hoc/duc)
- [Câu chuyện học viên Kaizen](/cau-chuyen)
- [Đăng ký tư vấn miễn phí](/dang-ky)

*Nguồn: DGB-Ausbildungsreport 2026; Bundesinstitut für Berufsbildung (BIBB), dữ liệu Ausbildungsvergütung 2025.*$body1$::text))
  WHERE e.slug = 'hoc-nghe-duc-ap-luc-dang-la-van-de-dang-lo-hon-ban-nghi';

  SELECT replace(data->>'body', E'.' || chr(10) || chr(10) || 'webp?', '.webp?')
    INTO b FROM public.cms_entries WHERE slug = 'hinh-anh-hoc-vien-kaizen-tai-chlb-duc-du-hoc-nghe-duc';
  SELECT array_agg(m[1]) INTO imgs FROM regexp_matches(b, 'src="([^"\s]+)"?', 'g') m;

  UPDATE public.cms_entries e
  SET title = 'Hình ảnh học viên Kaizen tại CHLB Đức, du học nghề Đức',
      seo = jsonb_build_object(
        'meta_title', 'Học viên Kaizen tại Đức: cuộc sống du học nghề | Kaizen',
        'meta_description', 'Hình ảnh học viên Kaizen học tập, làm việc và team building tại CHLB Đức. Xem cuộc sống thật của du học sinh nghề Đức. Đăng ký tư vấn miễn phí.',
        'og_title', 'Học viên Kaizen tại CHLB Đức, cuộc sống du học nghề',
        'og_description', 'Những khoảnh khắc học tập, làm việc và team building của học viên Kaizen tại Đức.',
        'og_image', coalesce(e.cover_image, '')
      ),
      data = jsonb_set(e.data, '{body}', to_jsonb(
        '## Cuộc sống của học viên Kaizen tại Đức'::text || E'\n\n' ||
        'Cuộc sống tại Đức không chỉ có học tập và công việc. Đó còn là những trải nghiệm đáng nhớ cùng đồng nghiệp và bạn bè quốc tế.' || E'\n\n' ||
        coalesce('![Học viên Kaizen tham gia team building cùng đồng nghiệp tại CHLB Đức](' || imgs[1] || ')' || E'\n\n', '') ||
        '## Team building cùng doanh nghiệp Đức' || E'\n\n' ||
        'Cuối tuần vừa qua, học viên Kaizen đã tham gia hoạt động team building do công ty tổ chức. Đây là dịp để mọi người thư giãn, giao lưu và tăng tinh thần đồng đội trong hành trình sống, làm việc tại Đức.' || E'\n\n' ||
        coalesce('![Học viên Kaizen chụp ảnh lưu niệm trong chuyến team building tại Đức](' || imgs[2] || ')' || E'\n\n', '') ||
        'Mỗi trải nghiệm đều là một bài học. Mỗi cuộc gặp gỡ đều là cơ hội để trưởng thành.' || E'\n\n' ||
        '## Bạn cũng muốn sang Đức học nghề?' || E'\n\n' ||
        '- [Chương trình du học nghề Đức](/du-hoc/duc)' || E'\n' ||
        '- [Khoá tiếng Đức A1 đến B2 tại Kaizen](/ngoai-ngu)' || E'\n' ||
        '- [Đăng ký tư vấn miễn phí](/dang-ky)'
      ))
  WHERE e.slug = 'hinh-anh-hoc-vien-kaizen-tai-chlb-duc-du-hoc-nghe-duc';

  SELECT replace(data->>'body', E'.' || chr(10) || chr(10) || 'webp?', '.webp?')
    INTO b FROM public.cms_entries WHERE slug = 'hinh-anh-cac-ban-du-hoc-sinh-tai-kaizen';
  SELECT array_agg(m[1]) INTO imgs FROM regexp_matches(b, 'src="([^"\s]+)"?', 'g') m;

  UPDATE public.cms_entries e
  SET title = 'Hình ảnh lớp học ngoại ngữ tại Trung tâm Kaizen',
      seo = jsonb_build_object(
        'meta_title', 'Lớp học ngoại ngữ tại Kaizen: hình ảnh thực tế | Kaizen',
        'meta_description', 'Hình ảnh lớp học ngoại ngữ tại Trung tâm Quốc tế Kaizen: phòng học hiện đại, giảng viên tận tâm, học viên chủ động. Đăng ký học thử miễn phí.',
        'og_title', 'Lớp học ngoại ngữ tại Trung tâm Kaizen',
        'og_description', 'Không gian học tập hiện đại, thân thiện và hiệu quả cho học viên du học và xuất khẩu lao động.',
        'og_image', coalesce(e.cover_image, '')
      ),
      data = jsonb_set(e.data, '{body}', to_jsonb(
        '## Không gian học tập truyền cảm hứng'::text || E'\n\n' ||
        'Với đội ngũ giảng viên giàu kinh nghiệm, giáo trình cập nhật và môi trường học tập chuyên nghiệp, Trung tâm Ngoại ngữ Quốc tế Kaizen mang đến chất lượng đào tạo tốt nhất. Học viên tự tin chinh phục các kỳ thi chứng chỉ quốc tế và hiện thực hoá ước mơ du học, làm việc tại nước ngoài.' || E'\n\n' ||
        coalesce('![Lớp học ngoại ngữ tại Trung tâm Quốc tế Kaizen với đầy đủ trang thiết bị](' || imgs[1] || ')' || E'\n\n', '') ||
        '## Tinh thần học tập của học viên Kaizen' || E'\n\n' ||
        'Những hình ảnh lớp học phản ánh tinh thần học tập nghiêm túc của học viên. Đó cũng là minh chứng cho sự tận tâm của Kaizen khi xây dựng môi trường giáo dục hiện đại và giàu tính thực tiễn.' || E'\n\n' ||
        coalesce('![Học viên Kaizen tập trung trong giờ học ngoại ngữ](' || imgs[2] || ')' || E'\n\n', '') ||
        '## Đồng hành cùng bạn ra thế giới' || E'\n\n' ||
        'Trung tâm Ngoại ngữ Quốc tế Kaizen luôn sẵn sàng đồng hành cùng bạn trên hành trình chinh phục ngoại ngữ và mở rộng cơ hội vươn ra thế giới.' || E'\n\n' ||
        '- [Các khoá ngoại ngữ tại Kaizen](/ngoai-ngu)' || E'\n' ||
        '- [Chương trình du học](/du-hoc)' || E'\n' ||
        '- [Đăng ký tư vấn miễn phí](/dang-ky)'
      ))
  WHERE e.slug = 'hinh-anh-cac-ban-du-hoc-sinh-tai-kaizen';
END
$mig$;

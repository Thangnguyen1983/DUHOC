DO $$
DECLARE
  c1 uuid := gen_random_uuid();
  c2 uuid := gen_random_uuid();
  m uuid;
BEGIN
  -- ============ COURSE 1: Tiếng Hàn TOPIK I ============
  INSERT INTO public.courses (
    id, slug, title, subtitle, description, cover_url,
    trailer_provider, trailer_video_id, language, level, category, tags,
    price_vnd, sale_price_vnd, is_free, is_published, published_at,
    requirements, outcomes, target_audience,
    total_lessons, total_minutes, rating_avg, rating_count, students_count, seo, meta
  ) VALUES (
    c1,
    'tieng-han-so-cap-luyen-thi-topik-i',
    'Tiếng Hàn sơ cấp — Luyện thi TOPIK I',
    'Từ bảng chữ Hangeul đến mục tiêu TOPIK cấp 2 trong 12 tuần.',
    E'Khoá học dành cho người bắt đầu học tiếng Hàn từ con số 0, hướng tới kỳ thi TOPIK I.\n\nBạn học bảng chữ Hangeul, phát âm chuẩn, 1.200 từ vựng thông dụng và 60 mẫu ngữ pháp sơ cấp. Mỗi chương có bài luyện nghe, luyện đọc và bài kiểm tra ngắn để bạn tự đánh giá.\n\nGiảng viên chữa bài trực tiếp trong mục hỏi đáp. Sau khoá học, bạn tự tin làm đề TOPIK I và giao tiếp trong tình huống hằng ngày.',
    'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&q=80',
    'youtube', 'ukzFI9rgwfU', 'ko', 'beginner', 'Tiếng Hàn',
    ARRAY['tiếng Hàn','TOPIK','sơ cấp','du học Hàn Quốc'],
    1990000, 1290000, false, true, now(),
    ARRAY['Không cần kiến thức tiếng Hàn trước đó','Máy tính hoặc điện thoại có kết nối internet','Dành 45 phút mỗi ngày để luyện tập'],
    ARRAY['Đọc viết thành thạo bảng chữ Hangeul','Nắm 1.200 từ vựng và 60 mẫu ngữ pháp sơ cấp','Nghe hiểu hội thoại đời sống tốc độ chậm','Tự tin làm trọn đề thi TOPIK I','Giao tiếp cơ bản: chào hỏi, mua sắm, hỏi đường'],
    ARRAY['Học sinh chuẩn bị du học Hàn Quốc','Người lao động chuẩn bị đi làm việc tại Hàn Quốc','Người mới bắt đầu tự học tiếng Hàn'],
    14, 385, 4.8, 126, 842,
    jsonb_build_object(
      'title','Khoá học tiếng Hàn sơ cấp luyện thi TOPIK I — Kaizen',
      'description','Học tiếng Hàn từ số 0 tới TOPIK cấp 2 trong 12 tuần. 14 bài học, 1.200 từ vựng, 60 mẫu ngữ pháp, có chứng chỉ hoàn thành.',
      'keywords', ARRAY['học tiếng Hàn online','luyện thi TOPIK I','tiếng Hàn sơ cấp']
    ),
    jsonb_build_object('duration_weeks',12,'certificate',true)
  );

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c1, 'Chương 1 — Bảng chữ Hangeul', 'Nguyên âm, phụ âm, patchim và quy tắc phát âm.', 1);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c1, 'Giới thiệu khoá học và lộ trình 12 tuần', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 540, true, 1),
    (m, c1, 'Nguyên âm cơ bản và nguyên âm đôi', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1320, true, 2),
    (m, c1, 'Phụ âm và quy tắc ghép chữ', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1500, false, 3),
    (m, c1, 'Patchim và biến âm thường gặp', 'text', NULL, NULL, E'## Patchim là gì\n\nPatchim là phụ âm cuối của một âm tiết tiếng Hàn.\n\n### Bảy âm đại diện\n\nMọi patchim đều đọc về một trong bảy âm: ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ.\n\n### Nối âm\n\nKhi âm tiết sau bắt đầu bằng ㅇ, patchim chuyển sang đọc cùng âm tiết đó. Ví dụ: 한국어 đọc là 한구거.', 900, false, 4);

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c1, 'Chương 2 — Giao tiếp hằng ngày', 'Chào hỏi, giới thiệu bản thân, số đếm và thời gian.', 2);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c1, 'Chào hỏi và giới thiệu bản thân', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1620, false, 1),
    (m, c1, 'Hai hệ số đếm Hán Hàn và thuần Hàn', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1440, false, 2),
    (m, c1, 'Hỏi giờ, ngày tháng và hẹn gặp', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1380, false, 3),
    (m, c1, 'Kiểm tra chương 2', 'quiz', NULL, NULL, E'Bài kiểm tra 15 câu về từ vựng và mẫu câu chương 2. Điểm đạt: 70%.', 900, false, 4);

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c1, 'Chương 3 — Ngữ pháp sơ cấp trọng tâm', 'Trợ từ, thì hiện tại, quá khứ và tương lai.', 3);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c1, 'Trợ từ 은/는, 이/가, 을/를', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1740, false, 1),
    (m, c1, 'Thì hiện tại và đuôi câu lịch sự 습니다 / 아요', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1680, false, 2),
    (m, c1, 'Thì quá khứ 았/었 và tương lai 을 거예요', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1560, false, 3);

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c1, 'Chương 4 — Luyện đề TOPIK I', 'Chiến thuật làm bài nghe và đọc, giải đề thật.', 4);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c1, 'Cấu trúc đề thi và chiến thuật phân bổ thời gian', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 1200, false, 1),
    (m, c1, 'Giải chi tiết phần Nghe (듣기)', 'video', 'youtube', 'ukzFI9rgwfU', NULL, 2100, false, 2),
    (m, c1, 'Đề thi thử TOPIK I hoàn chỉnh', 'assignment', NULL, NULL, E'Làm trọn một đề TOPIK I trong 100 phút, nộp ảnh phiếu trả lời để giảng viên chấm và nhận xét.', 6000, false, 3);

  -- ============ COURSE 2: Tiếng Nhật N5 miễn phí ============
  INSERT INTO public.courses (
    id, slug, title, subtitle, description, cover_url,
    trailer_provider, trailer_video_id, language, level, category, tags,
    price_vnd, sale_price_vnd, is_free, is_published, published_at,
    requirements, outcomes, target_audience,
    total_lessons, total_minutes, rating_avg, rating_count, students_count, seo, meta
  ) VALUES (
    c2,
    'tieng-nhat-nhap-mon-n5-cho-nguoi-moi',
    'Tiếng Nhật nhập môn N5 cho người mới',
    'Học miễn phí bảng chữ Hiragana, Katakana và 300 từ vựng nền tảng.',
    E'Khoá học miễn phí giúp bạn khởi động tiếng Nhật đúng cách.\n\nBạn học trọn bảng Hiragana và Katakana, 300 từ vựng thông dụng, 25 mẫu ngữ pháp N5 và cách chào hỏi trong môi trường làm việc Nhật Bản.\n\nMỗi bài đều có phần luyện viết và luyện nghe kèm theo. Đây là bước đệm trước khi bạn tham gia lớp luyện thi JLPT N5 tại Kaizen.',
    'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&q=80',
    'youtube', 'wMTXvC5RiWM', 'ja', 'beginner', 'Tiếng Nhật',
    ARRAY['tiếng Nhật','JLPT','N5','xuất khẩu lao động Nhật Bản'],
    0, NULL, true, true, now(),
    ARRAY['Không cần kiến thức tiếng Nhật trước đó','Chuẩn bị vở ô ly để luyện viết chữ'],
    ARRAY['Đọc viết thành thạo Hiragana và Katakana','Nhớ 300 từ vựng nền tảng theo chủ đề','Sử dụng 25 mẫu ngữ pháp N5 cơ bản','Chào hỏi và tự giới thiệu trong môi trường công sở Nhật'],
    ARRAY['Người lao động chuẩn bị sang Nhật Bản làm việc','Học sinh dự định du học Nhật Bản','Người mới bắt đầu muốn thử sức với tiếng Nhật'],
    10, 240, 4.7, 89, 1536,
    jsonb_build_object(
      'title','Học tiếng Nhật N5 miễn phí cho người mới bắt đầu — Kaizen',
      'description','Khoá tiếng Nhật nhập môn N5 miễn phí: Hiragana, Katakana, 300 từ vựng và 25 mẫu ngữ pháp. Học online mọi lúc cùng Kaizen.',
      'keywords', ARRAY['học tiếng Nhật miễn phí','tiếng Nhật N5','JLPT N5 cho người mới']
    ),
    jsonb_build_object('duration_weeks',6,'certificate',true)
  );

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c2, 'Chương 1 — Hiragana', 'Trọn 46 chữ cái cơ bản và cách luyện viết.', 1);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c2, 'Làm quen tiếng Nhật và ba bảng chữ', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 720, true, 1),
    (m, c2, 'Hiragana hàng あ đến と', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1500, true, 2),
    (m, c2, 'Hiragana hàng な đến ん', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1440, false, 3),
    (m, c2, 'Âm đục, âm ghép và trường âm', 'text', NULL, NULL, E'## Âm đục (濁音)\n\nThêm dấu ten-ten vào hàng か, さ, た, は để tạo が, ざ, だ, ば.\n\n## Âm ghép (拗音)\n\nGhép chữ nhỏ ゃ, ゅ, ょ sau các chữ hàng い. Ví dụ: きゃ, しゅ, ちょ.\n\n## Trường âm\n\nKéo dài nguyên âm một nhịp. Ví dụ: おかあさん đọc kéo dài âm a.', 900, false, 4);

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c2, 'Chương 2 — Katakana và từ vựng', 'Chữ Katakana cùng 300 từ vựng theo chủ đề.', 2);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c2, 'Katakana và từ mượn thường gặp', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1620, false, 1),
    (m, c2, 'Từ vựng chủ đề gia đình và nghề nghiệp', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1380, false, 2),
    (m, c2, 'Từ vựng nơi làm việc và an toàn lao động', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1500, false, 3),
    (m, c2, 'Kiểm tra bảng chữ và từ vựng', 'quiz', NULL, NULL, E'Bài kiểm tra 20 câu nhận diện chữ và nghĩa từ vựng. Điểm đạt: 70%.', 900, false, 4);

  m := gen_random_uuid();
  INSERT INTO public.course_modules (id, course_id, title, summary, order_index) VALUES
    (m, c2, 'Chương 3 — Ngữ pháp và giao tiếp N5', 'Mẫu câu nền tảng và hội thoại công sở.', 3);
  INSERT INTO public.course_lessons (module_id, course_id, title, type, video_provider, video_id, content_md, duration_seconds, is_preview, order_index) VALUES
    (m, c2, 'Mẫu câu です / ます và trợ từ は, が, を', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1740, false, 1),
    (m, c2, 'Chào hỏi và tự giới thiệu trong công ty Nhật', 'video', 'youtube', 'wMTXvC5RiWM', NULL, 1320, false, 2);
END $$;
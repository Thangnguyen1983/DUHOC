DO $$
DECLARE
  post_type uuid := '51bd7e37-6acf-42cc-9f7d-8580cc460723';
  cat_news uuid := 'bbc7330c-40cc-4311-92ce-26d84ce44607';
  cat_exp  uuid := '5df23088-6a77-4127-a20b-8b89ced8f8dd';
  cat_guide uuid := 'ad45496f-037c-48cf-a4c2-0dfaecf6a50e';
  markets text[][] := ARRAY[
    ARRAY['nhat-ban','Nhật Bản'],
    ARRAY['han-quoc','Hàn Quốc'],
    ARRAY['dai-loan','Đài Loan'],
    ARRAY['duc','CHLB Đức'],
    ARRAY['hungary','Hungary'],
    ARRAY['ba-lan','Ba Lan'],
    ARRAY['romania','Romania'],
    ARRAY['slovakia','Slovakia'],
    ARRAY['latvia','Latvia'],
    ARRAY['bulgaria','Bulgaria']
  ];
  news_titles text[] := ARRAY[
    'Cập nhật đơn hàng XKLĐ %s tháng %s/2026',
    'Chính sách visa lao động %s mới nhất năm 2026',
    'Mức lương ngành sản xuất tại %s tăng trong quý %s',
    'Nghiệp đoàn %s tuyển kỹ thuật viên đợt %s',
    'Kaizen mở đợt tuyển %s — lịch phỏng vấn tháng %s'
  ];
  exp_titles text[] := ARRAY[
    'Nhật ký 6 tháng đầu làm việc tại %s',
    'Kinh nghiệm hoà nhập văn hoá %s cho lao động Việt',
    'Chia sẻ cách tiết kiệm chi phí sinh hoạt ở %s',
    'Câu chuyện thăng tiến của kỹ sư Việt tại %s',
    'Bí quyết học tiếng để làm việc hiệu quả ở %s'
  ];
  guide_titles text[] := ARRAY[
    'Hướng dẫn chuẩn bị hồ sơ XKLĐ %s từ A-Z',
    'Quy trình khám sức khoẻ đi %s — checklist đầy đủ',
    'Cách chọn nghiệp đoàn/chủ sử dụng uy tín tại %s',
    'Hướng dẫn xin visa lao động %s 2026',
    'Chuẩn bị hành lý và chi phí ban đầu khi sang %s'
  ];
  m text[]; mslug text; mname text;
  i int; cat uuid; titles text[]; cat_slug text;
  new_id uuid; new_slug text; ttl text; excerpt text; cover text;
BEGIN
  FOREACH m SLICE 1 IN ARRAY markets LOOP
    mslug := m[1]; mname := m[2];
    FOR cat_slug IN SELECT unnest(ARRAY['tin-tuc','kinh-nghiem','huong-dan']) LOOP
      IF cat_slug = 'tin-tuc' THEN cat := cat_news; titles := news_titles;
      ELSIF cat_slug = 'kinh-nghiem' THEN cat := cat_exp; titles := exp_titles;
      ELSE cat := cat_guide; titles := guide_titles;
      END IF;
      FOR i IN 1..5 LOOP
        ttl := format(titles[i], mname, i+3);
        new_slug := format('sample-%s-%s-%s', mslug, cat_slug, i);
        excerpt := format('Bài viết mẫu %s về thị trường %s — nội dung dùng để kiểm chứng hiển thị hero, floating stats và hiệu ứng marquee trên trang chi tiết XKLĐ.', cat_slug, mname);
        cover := format('https://picsum.photos/seed/%s-%s-%s/640/480', mslug, cat_slug, i);
        INSERT INTO cms_entries (content_type_id, slug, title, excerpt, cover_image, status, published_at, module, market, data)
        VALUES (post_type, new_slug, ttl, excerpt, cover, 'published', now() - ((i * 2) || ' days')::interval, 'xkld', mslug,
                jsonb_build_object('body', '<p>' || excerpt || '</p><p>Đây là bài viết mẫu do hệ thống tạo tự động để kiểm chứng UI/UX. Vui lòng thay bằng nội dung thực trước khi phát hành chính thức.</p>'))
        ON CONFLICT (content_type_id, slug) DO UPDATE
          SET title = EXCLUDED.title,
              excerpt = EXCLUDED.excerpt,
              cover_image = EXCLUDED.cover_image,
              status = 'published',
              published_at = EXCLUDED.published_at,
              module = EXCLUDED.module,
              market = EXCLUDED.market
        RETURNING id INTO new_id;
        INSERT INTO cms_entry_categories (entry_id, category_id) VALUES (new_id, cat)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
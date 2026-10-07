-- 1. Thêm cột taxonomy vào cms_entries
ALTER TABLE public.cms_entries
  ADD COLUMN IF NOT EXISTS module   text,
  ADD COLUMN IF NOT EXISTS market   text,
  ADD COLUMN IF NOT EXISTS pinned   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS cms_entries_module_market_idx
  ON public.cms_entries (module, market, status, published_at DESC)
  WHERE deleted_at IS NULL;

-- 2. Content type: post
INSERT INTO public.cms_content_types (slug, name, description, icon, template, field_schema, is_active)
VALUES (
  'post',
  'Bài viết',
  'Bài viết chung: tin tức, kinh nghiệm, hướng dẫn, hỏi đáp — gắn theo Module + Thị trường',
  'FileText',
  'post-template',
  jsonb_build_object(
    'requires_module_market', true,
    'fields', jsonb_build_array(
      jsonb_build_object('key','summary','label','Tóm tắt','type','textarea','required',false),
      jsonb_build_object('key','content_html','label','Nội dung','type','richtext','required',true),
      jsonb_build_object('key','reading_minutes','label','Số phút đọc','type','number','required',false),
      jsonb_build_object('key','gallery','label','Ảnh phụ','type','image_array','required',false)
    )
  ),
  true
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  template = EXCLUDED.template,
  field_schema = EXCLUDED.field_schema;

-- 3. Content type: market_hub
INSERT INTO public.cms_content_types (slug, name, description, icon, template, field_schema, is_active)
VALUES (
  'market_hub',
  'Thị trường (Portal)',
  'Cấu hình trang portal cho 1 thị trường: hero, ngành nghề, chi phí, quy trình, FAQ. 1 entry / (module + quốc gia).',
  'Globe',
  'market-hub-template',
  jsonb_build_object(
    'fields', jsonb_build_array(
      jsonb_build_object('key','module','label','Module','type','select','required',true,'options', jsonb_build_array('xkld','du-hoc','ngoai-ngu','outsourcing')),
      jsonb_build_object('key','country_slug','label','Slug quốc gia','type','text','required',true),
      jsonb_build_object('key','flag_emoji','label','Cờ (emoji)','type','text'),
      jsonb_build_object('key','hero','label','Hero','type','object'),
      jsonb_build_object('key','quick_stats','label','Số liệu nhanh','type','repeater'),
      jsonb_build_object('key','intro_blocks','label','Khối giới thiệu','type','repeater'),
      jsonb_build_object('key','industries','label','Ngành nghề','type','repeater'),
      jsonb_build_object('key','cost_breakdown','label','Chi phí','type','repeater'),
      jsonb_build_object('key','timeline','label','Quy trình','type','repeater'),
      jsonb_build_object('key','requirements','label','Hồ sơ / yêu cầu','type','repeater'),
      jsonb_build_object('key','faqs','label','FAQ tĩnh (bổ sung)','type','repeater'),
      jsonb_build_object('key','partners_tag','label','Tag đối tác','type','text'),
      jsonb_build_object('key','news_category','label','Danh mục tin tức','type','text','default','tin-tuc'),
      jsonb_build_object('key','experience_category','label','Danh mục kinh nghiệm','type','text','default','kinh-nghiem'),
      jsonb_build_object('key','guide_category','label','Danh mục hướng dẫn','type','text','default','huong-dan'),
      jsonb_build_object('key','faq_category','label','Danh mục FAQ','type','text','default','hoi-dap'),
      jsonb_build_object('key','related_limit','label','Số bài liên quan','type','number','default',6)
    )
  ),
  true
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  template = EXCLUDED.template,
  field_schema = EXCLUDED.field_schema;

-- 4. Seed danh mục chuẩn
INSERT INTO public.cms_categories (slug, name, description, sort_order, is_active) VALUES
  ('tin-tuc',     'Tin tức',     'Tin tức thị trường',                      10, true),
  ('kinh-nghiem', 'Kinh nghiệm', 'Kinh nghiệm thực tế của học viên/NLĐ',    20, true),
  ('huong-dan',   'Hướng dẫn',   'Hướng dẫn thủ tục, hồ sơ, quy trình',     30, true),
  ('hoi-dap',     'Hỏi đáp',     'Câu hỏi thường gặp',                      40, true),
  ('chi-phi',     'Chi phí',     'Thông tin chi phí, học phí, lương',       50, true),
  ('nganh-nghe',  'Ngành nghề',  'Danh sách ngành nghề, đơn hàng',          60, true)
ON CONFLICT (slug) DO NOTHING;
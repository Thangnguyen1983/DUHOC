
INSERT INTO public.cms_content_types (slug, name, template, sort_order, field_schema)
VALUES
  ('news',          'Tin tức',                'article', 11, '{}'::jsonb),
  ('guide',         'Cẩm nang du học',        'article', 12, '{}'::jsonb),
  ('success_story', 'Câu chuyện học viên',    'article', 13, '{}'::jsonb),
  ('school',        'Trường / Đối tác',        'article', 14, '{}'::jsonb),
  ('library_item',  'Tư liệu thư viện',       'article', 15, '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

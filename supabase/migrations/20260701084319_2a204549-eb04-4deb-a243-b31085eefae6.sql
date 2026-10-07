INSERT INTO public.cms_content_types (slug, name, template, sort_order, field_schema, is_active)
VALUES (
  'market_landing',
  'Trang thị trường',
  'market_landing',
  20,
  '{
    "blocks": [
      {"key":"hero","label":"Hero","fields":[
        {"key":"eyebrow","label":"Nhãn nhỏ","type":"text"},
        {"key":"headline","label":"Tiêu đề chính","type":"text"},
        {"key":"subheadline","label":"Mô tả","type":"textarea"},
        {"key":"image","label":"Ảnh nền","type":"image"},
        {"key":"cta_primary_label","label":"CTA chính","type":"text"},
        {"key":"cta_primary_href","label":"Link CTA chính","type":"text"},
        {"key":"cta_secondary_label","label":"CTA phụ","type":"text"},
        {"key":"cta_secondary_href","label":"Link CTA phụ","type":"text"}
      ]},
      {"key":"stats","label":"Thống kê","type":"repeater","fields":[
        {"key":"label","label":"Nhãn","type":"text"},
        {"key":"value","label":"Giá trị","type":"text"},
        {"key":"note","label":"Ghi chú","type":"text"}
      ]},
      {"key":"industries","label":"Ngành / Chương trình","type":"repeater","fields":[
        {"key":"name","label":"Tên ngành","type":"text"},
        {"key":"image","label":"Ảnh","type":"image"},
        {"key":"duration","label":"Thời gian","type":"text"},
        {"key":"salary","label":"Mức lương","type":"text"},
        {"key":"desc","label":"Mô tả","type":"textarea"},
        {"key":"bullets","label":"Điểm nhấn (mỗi dòng 1 ý)","type":"textarea"},
        {"key":"hot","label":"Đánh dấu HOT","type":"boolean"}
      ]},
      {"key":"roadmap","label":"Lộ trình","type":"repeater","fields":[
        {"key":"step","label":"Bước","type":"text"},
        {"key":"title","label":"Tiêu đề","type":"text"},
        {"key":"duration","label":"Thời gian","type":"text"},
        {"key":"desc","label":"Mô tả","type":"textarea"}
      ]},
      {"key":"highlights","label":"Vì sao chọn thị trường này","type":"repeater","fields":[
        {"key":"title","label":"Tiêu đề","type":"text"},
        {"key":"desc","label":"Mô tả","type":"textarea"}
      ]},
      {"key":"faq","label":"FAQ","type":"repeater","fields":[
        {"key":"q","label":"Câu hỏi","type":"text"},
        {"key":"a","label":"Trả lời","type":"textarea"}
      ]}
    ]
  }'::jsonb,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  template = EXCLUDED.template,
  field_schema = EXCLUDED.field_schema,
  is_active = EXCLUDED.is_active;
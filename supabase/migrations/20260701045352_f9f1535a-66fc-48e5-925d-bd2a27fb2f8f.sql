
-- ================= CONTENT TYPES =================
CREATE TABLE public.cms_content_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  template text,
  field_schema jsonb NOT NULL DEFAULT '{"fields":[]}'::jsonb,
  is_singleton boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_content_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_content_types TO authenticated;
GRANT ALL ON public.cms_content_types TO service_role;
ALTER TABLE public.cms_content_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_ct_public_read" ON public.cms_content_types FOR SELECT TO anon, authenticated USING (is_active = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));
CREATE POLICY "cms_ct_admin_write" ON public.cms_content_types FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER cms_ct_updated_at BEFORE UPDATE ON public.cms_content_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================= CATEGORIES =================
CREATE TABLE public.cms_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.cms_categories(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_image text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_categories TO authenticated;
GRANT ALL ON public.cms_categories TO service_role;
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_cat_public_read" ON public.cms_categories FOR SELECT TO anon, authenticated USING (is_active = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor'));
CREATE POLICY "cms_cat_staff_write" ON public.cms_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'content'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'content'));
CREATE INDEX cms_categories_parent_idx ON public.cms_categories(parent_id);
CREATE TRIGGER cms_cat_updated_at BEFORE UPDATE ON public.cms_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================= TAGS =================
CREATE TABLE public.cms_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_tags TO authenticated;
GRANT ALL ON public.cms_tags TO service_role;
ALTER TABLE public.cms_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_tag_public_read" ON public.cms_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cms_tag_staff_write" ON public.cms_tags FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo'));

-- ================= ENTRIES =================
CREATE TABLE public.cms_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type_id uuid NOT NULL REFERENCES public.cms_content_types(id) ON DELETE RESTRICT,
  slug text NOT NULL,
  title text NOT NULL,
  excerpt text,
  cover_image text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','scheduled','published','archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  version int NOT NULL DEFAULT 1,
  view_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type_id, slug)
);
GRANT SELECT ON public.cms_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_entries TO authenticated;
GRANT ALL ON public.cms_entries TO service_role;
ALTER TABLE public.cms_entries ENABLE ROW LEVEL SECURITY;

-- Public đọc entry đã xuất bản, chưa xóa
CREATE POLICY "cms_entries_public_read" ON public.cms_entries FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND deleted_at IS NULL)
    OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
    OR (has_role(auth.uid(),'contributor') AND author_id = auth.uid())
  );

-- Contributor chỉ tạo bài của chính mình
CREATE POLICY "cms_entries_contributor_insert" ON public.cms_entries FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'contributor') AND author_id = auth.uid()
  );

-- Nhân sự nội dung tạo bài
CREATE POLICY "cms_entries_staff_insert" ON public.cms_entries FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  );

-- Contributor sửa bài của mình
CREATE POLICY "cms_entries_contributor_update" ON public.cms_entries FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'contributor') AND author_id = auth.uid())
  WITH CHECK (has_role(auth.uid(),'contributor') AND author_id = auth.uid() AND status IN ('draft','pending'));

-- Nhân sự sửa mọi bài
CREATE POLICY "cms_entries_staff_update" ON public.cms_entries FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  )
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  );

-- Chỉ admin xóa vĩnh viễn
CREATE POLICY "cms_entries_admin_delete" ON public.cms_entries FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE INDEX cms_entries_type_status_idx ON public.cms_entries(content_type_id, status);
CREATE INDEX cms_entries_slug_idx ON public.cms_entries(slug);
CREATE INDEX cms_entries_published_at_idx ON public.cms_entries(published_at DESC);
CREATE INDEX cms_entries_deleted_at_idx ON public.cms_entries(deleted_at);
CREATE INDEX cms_entries_author_idx ON public.cms_entries(author_id);

CREATE TRIGGER cms_entries_updated_at BEFORE UPDATE ON public.cms_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================= ENTRY REVISIONS =================
CREATE TABLE public.cms_entry_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.cms_entries(id) ON DELETE CASCADE,
  version int NOT NULL,
  title text NOT NULL,
  excerpt text,
  cover_image text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  editor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entry_id, version)
);
GRANT SELECT, INSERT ON public.cms_entry_revisions TO authenticated;
GRANT ALL ON public.cms_entry_revisions TO service_role;
ALTER TABLE public.cms_entry_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_rev_staff_read" ON public.cms_entry_revisions FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
    OR (has_role(auth.uid(),'contributor') AND editor_id = auth.uid())
  );
CREATE POLICY "cms_rev_staff_insert" ON public.cms_entry_revisions FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
    OR has_role(auth.uid(),'contributor')
  );
CREATE INDEX cms_rev_entry_idx ON public.cms_entry_revisions(entry_id, version DESC);

-- ================= ENTRY <-> CATEGORY / TAG =================
CREATE TABLE public.cms_entry_categories (
  entry_id uuid NOT NULL REFERENCES public.cms_entries(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.cms_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, category_id)
);
GRANT SELECT ON public.cms_entry_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_entry_categories TO authenticated;
GRANT ALL ON public.cms_entry_categories TO service_role;
ALTER TABLE public.cms_entry_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_ec_read" ON public.cms_entry_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cms_ec_staff_write" ON public.cms_entry_categories FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  )
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  );

CREATE TABLE public.cms_entry_tags (
  entry_id uuid NOT NULL REFERENCES public.cms_entries(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.cms_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);
GRANT SELECT ON public.cms_entry_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_entry_tags TO authenticated;
GRANT ALL ON public.cms_entry_tags TO service_role;
ALTER TABLE public.cms_entry_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_et_read" ON public.cms_entry_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cms_et_staff_write" ON public.cms_entry_tags FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  )
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  );

-- ================= AUDIT LOG =================
CREATE TABLE public.cms_audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.cms_audit_logs TO authenticated;
GRANT ALL ON public.cms_audit_logs TO service_role;
ALTER TABLE public.cms_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_audit_admin_read" ON public.cms_audit_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "cms_audit_staff_insert" ON public.cms_audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);
CREATE INDEX cms_audit_resource_idx ON public.cms_audit_logs(resource_type, resource_id);
CREATE INDEX cms_audit_actor_idx ON public.cms_audit_logs(actor_id, created_at DESC);

-- ================= MEDIA LIBRARY =================
CREATE TABLE public.cms_media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.cms_media_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media_folders TO authenticated;
GRANT ALL ON public.cms_media_folders TO service_role;
ALTER TABLE public.cms_media_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_mf_staff_all" ON public.cms_media_folders FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  )
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  );

CREATE TABLE public.cms_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.cms_media_folders(id) ON DELETE SET NULL,
  storage_bucket text NOT NULL DEFAULT 'cms-media',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  alt_text text,
  caption text,
  tags text[] DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(storage_bucket, storage_path)
);
GRANT SELECT ON public.cms_media_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media_assets TO authenticated;
GRANT ALL ON public.cms_media_assets TO service_role;
ALTER TABLE public.cms_media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cms_ma_public_read" ON public.cms_media_assets FOR SELECT TO anon, authenticated USING (is_public = true OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing'));
CREATE POLICY "cms_ma_staff_write" ON public.cms_media_assets FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  )
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')
    OR has_role(auth.uid(),'content') OR has_role(auth.uid(),'seo') OR has_role(auth.uid(),'marketing')
  );
CREATE TRIGGER cms_ma_updated_at BEFORE UPDATE ON public.cms_media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================= Seed content types =================
INSERT INTO public.cms_content_types (slug, name, description, icon, template, sort_order) VALUES
  ('blog','Bài viết / Tin tức','Bài viết, tin tức, blog','FileText','blog',10),
  ('service','Dịch vụ','Trang dịch vụ (du học, XKLĐ, đào tạo…)','Briefcase','service',20),
  ('landing','Landing Page','Trang đích chiến dịch','LayoutTemplate','landing',30),
  ('faq','FAQ','Câu hỏi thường gặp','HelpCircle','faq',40),
  ('policy','Chính sách','Chính sách, điều khoản','FileCheck','policy',50),
  ('case_study','Case Study','Câu chuyện thành công','Award','case_study',60),
  ('project','Dự án','Dự án doanh nghiệp','FolderKanban','project',70),
  ('static_page','Trang tĩnh','Giới thiệu, liên hệ…','File','static_page',80),
  ('promotion','Khuyến mãi','Ưu đãi, khuyến mãi','Percent','promotion',90),
  ('popup','Popup','Popup hiển thị site','Layers','popup',100)
ON CONFLICT (slug) DO NOTHING;

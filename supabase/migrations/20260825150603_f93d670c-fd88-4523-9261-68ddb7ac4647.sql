-- 1. Danh mục ngoại ngữ
CREATE TABLE public.catalog_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  flag text,
  tagline text,
  description text,
  levels text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalog_languages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_languages TO authenticated;
GRANT ALL ON public.catalog_languages TO service_role;
ALTER TABLE public.catalog_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog_languages_public_read" ON public.catalog_languages FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "catalog_languages_manage" ON public.catalog_languages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager'));
CREATE TRIGGER trg_catalog_languages_updated BEFORE UPDATE ON public.catalog_languages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Danh mục loại hồ sơ theo thị trường
CREATE TABLE public.catalog_document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  market text,
  description text,
  is_required boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, market)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_document_types TO authenticated;
GRANT ALL ON public.catalog_document_types TO service_role;
ALTER TABLE public.catalog_document_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_types_staff_read" ON public.catalog_document_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "doc_types_manage" ON public.catalog_document_types FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'visa_officer'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'visa_officer'));
CREATE TRIGGER trg_doc_types_updated BEFORE UPDATE ON public.catalog_document_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Danh mục giai đoạn đào tạo
CREATE TABLE public.catalog_training_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  order_index int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_training_stages TO authenticated;
GRANT ALL ON public.catalog_training_stages TO service_role;
ALTER TABLE public.catalog_training_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stages_staff_read" ON public.catalog_training_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "stages_manage" ON public.catalog_training_stages FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager'));
CREATE TRIGGER trg_stages_updated BEFORE UPDATE ON public.catalog_training_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Hồ sơ năng lực giáo viên (CV, bằng cấp, chứng chỉ)
CREATE TABLE public.teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  file_path text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes bigint,
  issued_at date,
  expires_at date,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_teacher_documents_teacher ON public.teacher_documents(teacher_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_documents TO authenticated;
GRANT ALL ON public.teacher_documents TO service_role;
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher_docs_manage" ON public.teacher_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager'));
CREATE POLICY "teacher_docs_self_read" ON public.teacher_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_documents.teacher_id AND t.user_id = auth.uid()));
CREATE TRIGGER trg_teacher_documents_updated BEFORE UPDATE ON public.teacher_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Chính sách kho tệp riêng cho hồ sơ giáo viên
CREATE POLICY "teacher_docs_bucket_manage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'teacher-docs' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager')))
  WITH CHECK (bucket_id = 'teacher-docs' AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager')));

-- 6. Trưởng thị trường: xem hồ sơ học viên & tài liệu
CREATE POLICY "market_head_view_students" ON public.student_profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'market_head'));
CREATE POLICY "market_head_view_documents" ON public.student_documents FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'market_head'));

-- 7. Dữ liệu khởi tạo danh mục
INSERT INTO public.catalog_languages (slug, name, flag, tagline, sort_order) VALUES
  ('tieng-nhat','Tiếng Nhật','🇯🇵','JLPT N5 — N1, luyện thi & giao tiếp',1),
  ('tieng-han','Tiếng Hàn','🇰🇷','TOPIK I — II, EPS-TOPIK',2),
  ('tieng-trung','Tiếng Trung','🇨🇳','HSK 1 — HSK 6',3),
  ('tieng-anh','Tiếng Anh','🇬🇧','Giao tiếp, IELTS, tiếng Anh du học',4),
  ('tieng-duc','Tiếng Đức','🇩🇪','A1 — B2 theo chuẩn Goethe',5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.catalog_training_stages (code, name, order_index) VALUES
  ('so_cap','Giai đoạn sơ cấp',1),
  ('trung_cap','Giai đoạn trung cấp',2),
  ('cao_cap','Giai đoạn cao cấp',3),
  ('luyen_thi','Giai đoạn luyện thi chứng chỉ',4),
  ('dinh_huong','Giáo dục định hướng trước xuất cảnh',5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.catalog_document_types (code, name, market, is_required, sort_order) VALUES
  ('cccd','Căn cước công dân', NULL, true, 1),
  ('hoc_ba','Học bạ / Bảng điểm', NULL, true, 2),
  ('bang_tot_nghiep','Bằng tốt nghiệp', NULL, true, 3),
  ('anh_the','Ảnh thẻ', NULL, true, 4),
  ('ho_chieu','Hộ chiếu', NULL, true, 5),
  ('kham_suc_khoe','Giấy khám sức khoẻ', NULL, true, 6),
  ('ly_lich_tu_phap','Lý lịch tư pháp', NULL, false, 7),
  ('chung_chi_ngoai_ngu','Chứng chỉ ngoại ngữ', NULL, true, 8),
  ('chung_minh_tai_chinh','Chứng minh tài chính','duc', true, 9),
  ('thu_moi_nhap_hoc','Thư mời nhập học','han-quoc', true, 10),
  ('hop_dong_lao_dong','Hợp đồng lao động','dai-loan', true, 11)
ON CONFLICT (code, market) DO NOTHING;
ALTER TABLE public.learning_materials
  ADD COLUMN IF NOT EXISTS market_code text,
  ADD COLUMN IF NOT EXISTS material_type text NOT NULL DEFAULT 'document',
  ADD COLUMN IF NOT EXISTS lesson_no integer,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS change_note text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS pdf_companion_path text,
  ADD COLUMN IF NOT EXISTS curriculum_slot_id uuid;

-- Tài liệu cũ đã dùng trong lớp → coi như đã duyệt để không mất truy cập của học viên.
UPDATE public.learning_materials SET approval_status = 'approved', approved_at = now() WHERE approval_status = 'draft';

CREATE INDEX IF NOT EXISTS learning_materials_approval_idx ON public.learning_materials(approval_status);
CREATE INDEX IF NOT EXISTS learning_materials_market_idx ON public.learning_materials(market_code);

CREATE OR REPLACE FUNCTION public.validate_learning_material()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.material_type NOT IN ('slide','pdf','audio','video','image','document') THEN
    RAISE EXCEPTION 'material_type không hợp lệ: %', NEW.material_type;
  END IF;
  IF NEW.approval_status NOT IN ('draft','pending','approved','rejected') THEN
    RAISE EXCEPTION 'approval_status không hợp lệ: %', NEW.approval_status;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_learning_material_trg ON public.learning_materials;
CREATE TRIGGER validate_learning_material_trg BEFORE INSERT OR UPDATE ON public.learning_materials
  FOR EACH ROW EXECUTE FUNCTION public.validate_learning_material();

-- Khung chương trình chuẩn
CREATE TABLE IF NOT EXISTS public.curriculum_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_code text NOT NULL,
  level text NOT NULL,
  name text NOT NULL,
  description text,
  total_lessons integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_templates TO authenticated;
GRANT ALL ON public.curriculum_templates TO service_role;
ALTER TABLE public.curriculum_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY ct_staff_all ON public.curriculum_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'training_staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'training_staff'));
CREATE POLICY ct_teacher_view ON public.curriculum_templates FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'teacher'));
CREATE TRIGGER ct_updated_at BEFORE UPDATE ON public.curriculum_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.curriculum_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.curriculum_templates(id) ON DELETE CASCADE,
  lesson_no integer NOT NULL,
  topic text NOT NULL,
  objectives text,
  required_types text[] NOT NULL DEFAULT ARRAY['slide']::text[],
  duration_minutes integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, lesson_no)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_template_items TO authenticated;
GRANT ALL ON public.curriculum_template_items TO service_role;
ALTER TABLE public.curriculum_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY cti_staff_all ON public.curriculum_template_items FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'training_staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'training_staff'));
CREATE POLICY cti_teacher_view ON public.curriculum_template_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'teacher'));

ALTER TABLE public.learning_materials
  ADD CONSTRAINT learning_materials_curriculum_slot_fk
  FOREIGN KEY (curriculum_slot_id) REFERENCES public.curriculum_template_items(id) ON DELETE SET NULL;

-- Lịch sử duyệt
CREATE TABLE IF NOT EXISTS public.material_approval_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.learning_materials(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mal_material_idx ON public.material_approval_logs(material_id, created_at DESC);
GRANT SELECT, INSERT ON public.material_approval_logs TO authenticated;
GRANT ALL ON public.material_approval_logs TO service_role;
ALTER TABLE public.material_approval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mal_staff_view ON public.material_approval_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'training_staff') OR actor_id = auth.uid());

-- Nhật ký trình chiếu
CREATE TABLE IF NOT EXISTS public.class_presentation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.training_classes(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  material_id uuid REFERENCES public.learning_materials(id) ON DELETE SET NULL,
  teacher_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cpl_class_idx ON public.class_presentation_logs(class_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.class_presentation_logs TO authenticated;
GRANT ALL ON public.class_presentation_logs TO service_role;
ALTER TABLE public.class_presentation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpl_staff_view ON public.class_presentation_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'training_manager') OR has_role(auth.uid(),'training_staff') OR teacher_id = auth.uid());

-- Học viên chỉ thấy tài liệu đã duyệt (giáo viên/giáo vụ vẫn thấy nháp của lớp mình)
DROP POLICY IF EXISTS lm_enrolled_view ON public.learning_materials;
CREATE POLICY lm_enrolled_view ON public.learning_materials FOR SELECT TO authenticated
USING (
  (approval_status = 'approved' AND (
    is_public = true
    OR EXISTS (
      SELECT 1 FROM training_enrollments te JOIN student_profiles sp ON sp.id = te.student_profile_id
      WHERE sp.user_id = auth.uid()
        AND (te.class_id = learning_materials.class_id
          OR EXISTS (SELECT 1 FROM training_classes tc WHERE tc.id = te.class_id AND tc.program_id = learning_materials.program_id))
    )
  ))
  OR EXISTS (
    SELECT 1 FROM training_classes tc JOIN teachers t ON t.id = tc.teacher_id
    WHERE t.user_id = auth.uid() AND (tc.id = learning_materials.class_id OR tc.program_id = learning_materials.program_id)
  )
  OR created_by = auth.uid()
);

-- Bộ mẫu chuẩn 3 thị trường
INSERT INTO public.curriculum_templates (id, market_code, level, name, description, total_lessons) VALUES
 ('d1000000-0000-0000-0000-000000000001','korea','TOPIK1-2','Tiếng Hàn TOPIK 1–2 (EPS)','Khung chuẩn 12 buổi cho học viên xuất khẩu lao động Hàn Quốc.',12),
 ('d1000000-0000-0000-0000-000000000002','japan','N5-N4','Tiếng Nhật N5–N4 (Thực tập sinh)','Khung chuẩn 12 buổi cho thực tập sinh kỹ năng Nhật Bản.',12),
 ('d1000000-0000-0000-0000-000000000003','germany','A1-B1','Tiếng Đức A1–B1 (Du học nghề/Điều dưỡng)','Khung chuẩn 12 buổi cho du học nghề CHLB Đức.',12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.curriculum_template_items (template_id, lesson_no, topic, objectives, required_types) VALUES
 ('d1000000-0000-0000-0000-000000000001',1,'Bảng chữ Hangul & phát âm','Đọc – viết 40 ký tự; quy tắc ghép âm',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000001',2,'Chào hỏi & giới thiệu bản thân','Câu 입니다/입니까; kính ngữ cơ bản',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000001',3,'Số đếm Hán – Thuần Hàn','Đếm tiền, giờ, tuổi',ARRAY['slide']),
 ('d1000000-0000-0000-0000-000000000001',4,'Thì hiện tại & trợ từ 은/는, 이/가','Đặt câu cơ bản',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000001',5,'Thời gian, ngày tháng, lịch làm việc','Nói lịch ca kíp',ARRAY['slide']),
 ('d1000000-0000-0000-0000-000000000001',6,'Thì quá khứ & tương lai','았/었, 을 거예요',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000001',7,'Giao tiếp nơi làm việc (EPS)','Từ vựng nhà xưởng, an toàn lao động',ARRAY['slide','audio','video']),
 ('d1000000-0000-0000-0000-000000000001',8,'Mua sắm, ăn uống, phương tiện','Hội thoại thực tế',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000001',9,'Ngữ pháp liên kết câu','고, 지만, 아서/어서',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000001',10,'Luyện nghe EPS-TOPIK','Dạng bài nghe 20 câu',ARRAY['audio','pdf']),
 ('d1000000-0000-0000-0000-000000000001',11,'Luyện đọc EPS-TOPIK','Dạng bài đọc 20 câu',ARRAY['pdf']),
 ('d1000000-0000-0000-0000-000000000001',12,'Thi thử & tổng ôn','Đề thi mô phỏng',ARRAY['pdf','audio']),
 ('d1000000-0000-0000-0000-000000000002',1,'Hiragana','Đọc – viết 46 ký tự',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000002',2,'Katakana & từ ngoại lai','Đọc tên máy móc, vật liệu',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000002',3,'Chào hỏi, tự giới thiệu (自己紹介)','Mẫu câu です/ます',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000002',4,'Số đếm, giờ, ngày tháng','Nói lịch làm việc',ARRAY['slide']),
 ('d1000000-0000-0000-0000-000000000002',5,'Trợ từ は/が/を/に/で','Đặt câu cơ bản',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000002',6,'Động từ nhóm 1-2-3, thể ます','Chia động từ',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000002',7,'Thể て & yêu cầu, xin phép','てください、てもいいですか',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000002',8,'Tiếng Nhật nơi làm việc (報連相)','Báo cáo – liên lạc – bàn bạc',ARRAY['slide','video']),
 ('d1000000-0000-0000-0000-000000000002',9,'Kanji N5 (100 chữ)','Đọc bảng chỉ dẫn',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000002',10,'Thể thường & thể た','Hội thoại thân mật',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000002',11,'Luyện nghe – đọc N4','Đề mẫu JLPT',ARRAY['audio','pdf']),
 ('d1000000-0000-0000-0000-000000000002',12,'Phỏng vấn nghiệp đoàn & thi thử','Mô phỏng phỏng vấn',ARRAY['video','pdf']),
 ('d1000000-0000-0000-0000-000000000003',1,'Bảng chữ cái & phát âm tiếng Đức','Umlaut, ß, trọng âm',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000003',2,'Chào hỏi, giới thiệu (sich vorstellen)','sein/haben, W-Fragen',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000003',3,'Giống danh từ & mạo từ','der/die/das, Nominativ',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000003',4,'Akkusativ & động từ tách','Đặt câu hằng ngày',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000003',5,'Thời gian, lịch làm việc, hẹn gặp','Termine vereinbaren',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000003',6,'Perfekt & Präteritum','Kể lại sự việc',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000003',7,'Dativ & giới từ','Chỉ đường, vị trí',ARRAY['slide']),
 ('d1000000-0000-0000-0000-000000000003',8,'Tiếng Đức chuyên ngành điều dưỡng','Từ vựng bệnh viện, chăm sóc',ARRAY['slide','video','pdf']),
 ('d1000000-0000-0000-0000-000000000003',9,'Câu phụ (weil, dass, wenn)','Viết đoạn ngắn',ARRAY['slide','pdf']),
 ('d1000000-0000-0000-0000-000000000003',10,'Konjunktiv II & lịch sự','Hội thoại nơi làm việc',ARRAY['slide','audio']),
 ('d1000000-0000-0000-0000-000000000003',11,'Luyện thi Goethe/telc B1','Nghe – đọc – viết',ARRAY['audio','pdf']),
 ('d1000000-0000-0000-0000-000000000003',12,'Thi thử & phỏng vấn','Mô phỏng đề B1',ARRAY['pdf','video'])
ON CONFLICT (template_id, lesson_no) DO NOTHING;
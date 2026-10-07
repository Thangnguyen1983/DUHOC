CREATE TABLE public.catalog_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.catalog_departments(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.catalog_job_titles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_departments TO authenticated;
GRANT ALL ON public.catalog_departments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_job_titles TO authenticated;
GRANT ALL ON public.catalog_job_titles TO service_role;

ALTER TABLE public.catalog_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_job_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Đọc danh mục phòng ban" ON public.catalog_departments
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Quản lý phòng ban" ON public.catalog_departments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Đọc danh mục chức danh" ON public.catalog_job_titles
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Quản lý chức danh" ON public.catalog_job_titles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.catalog_departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.catalog_job_titles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_job_title_id ON public.profiles(job_title_id);

INSERT INTO public.catalog_departments (code, name, description, sort_order, is_active) VALUES
  ('ban_giam_doc', 'Ban giám đốc', 'Điều hành và quản trị công ty', 1, true),
  ('tuyen_sinh_tu_van', 'Tuyển sinh & Tư vấn', 'Tiếp nhận và tư vấn khách hàng tiềm năng', 2, true),
  ('dao_tao', 'Đào tạo', 'Quản lý chương trình, lớp học, giáo viên', 3, true),
  ('ho_so_visa', 'Hồ sơ & Visa', 'Xử lý hồ sơ, visa và thủ tục pháp lý', 4, true),
  ('xuat_canh', 'Xuất cảnh', 'Điều phối vé máy bay, đón tiễn, bàn giao', 5, true),
  ('marketing_noi_dung', 'Marketing & Nội dung', 'Truyền thông, SEO, banner, chiến dịch', 6, true),
  ('cskh', 'Chăm sóc khách hàng', 'Hỗ trợ và theo dõi học viên sau bán', 7, true),
  ('hanh_chinh_nhan_su', 'Hành chính — Nhân sự', 'Hành chính, tuyển dụng, hồ sơ nhân sự', 8, true),
  ('ke_toan', 'Kế toán', 'Tài chính, kế toán, thanh toán', 9, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.catalog_job_titles (code, name, description, sort_order, is_active) VALUES
  ('giam_doc', 'Giám đốc', 'Điều hành cấp cao', 1, true),
  ('truong_phong', 'Trưởng phòng', 'Quản lý một phòng ban', 2, true),
  ('pho_phong', 'Phó phòng', 'Hỗ trợ trưởng phòng điều hành', 3, true),
  ('chuyen_vien', 'Chuyên viên', 'Xử lý chuyên môn nghiệp vụ', 4, true),
  ('nhan_vien', 'Nhân viên', 'Hỗ trợ vận hành hàng ngày', 5, true),
  ('giao_vien', 'Giáo viên', 'Giảng dạy và chấm điểm', 6, true),
  ('cong_tac_vien', 'Cộng tác viên', 'Hợp tác theo dự án/công việc', 7, true)
ON CONFLICT (code) DO NOTHING;

CREATE TRIGGER update_catalog_departments_updated_at BEFORE UPDATE ON public.catalog_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_catalog_job_titles_updated_at BEFORE UPDATE ON public.catalog_job_titles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.journey_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  cover_alt text NOT NULL DEFAULT '',
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('published','draft')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.journey_milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_milestones TO authenticated;
GRANT ALL ON public.journey_milestones TO service_role;

ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published milestones"
  ON public.journey_milestones FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can read all milestones"
  ON public.journey_milestones FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert milestones"
  ON public.journey_milestones FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update milestones"
  ON public.journey_milestones FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete milestones"
  ON public.journey_milestones FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER journey_milestones_set_updated_at
  BEFORE UPDATE ON public.journey_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX journey_milestones_sort_idx ON public.journey_milestones (sort_order);
CREATE INDEX journey_milestones_status_idx ON public.journey_milestones (status);

INSERT INTO public.journey_milestones (year, sort_order, slug, title, short_description, content, cover_image, cover_alt, achievements, status) VALUES
('2008–2009', 10, '2008-khoi-nguon',
  'Khởi nguồn & phát triển ban đầu',
  'Đặt nền móng trong lĩnh vực tư vấn giáo dục tại Nghệ An — hình thành đội ngũ cốt lõi và triết lý đồng hành cùng học viên.',
  'Năm 2008–2009 đánh dấu những bước đi đầu tiên của Kaizen tại Nghệ An. Một nhóm nhỏ những người sáng lập đặt nền móng cho lĩnh vực tư vấn giáo dục, định hình triết lý "Kaizen — cải tiến liên tục, đồng hành cùng học viên".',
  '/__l5e/assets-v1/b50fe19c-1b75-4d43-89e8-b22d39ac0d63/journey-2008.jpg',
  'Văn phòng tư vấn giáo dục Kaizen giai đoạn đầu',
  '["Hình thành đội ngũ cốt lõi","Định hình triết lý Kaizen","Văn phòng đầu tiên tại Nghệ An"]'::jsonb,
  'published'),
('2010', 20, '2010-thanh-lap',
  'Chính thức thành lập Kaizen Manpower',
  'Văn phòng đầu tiên tại thành phố Vinh — khởi đầu chính thức cho hành trình tư vấn du học Đông Á.',
  'Năm 2010, Kaizen Manpower chính thức được thành lập với văn phòng đầu tiên tại thành phố Vinh, đánh dấu bước chuyển mình từ tư vấn giáo dục sang hệ sinh thái du học Đông Á.',
  '/__l5e/assets-v1/b61707bc-31d5-40b1-b372-ff02431ecf52/journey-2010.jpg',
  'Lễ khai trương văn phòng Kaizen Manpower năm 2010',
  '["Khai trương văn phòng Vinh","Đăng ký pháp nhân chính thức","Mở thị trường Nhật Bản & Hàn Quốc"]'::jsonb,
  'published'),
('2014', 30, '2014-cap-phep-phai-cu',
  'Cấp phép phái cử lao động quốc tế',
  'Được Bộ LĐ-TB&XH cấp phép hoạt động đưa người lao động đi làm việc tại Nhật Bản và Hàn Quốc.',
  'Năm 2014, Kaizen Manpower được Bộ Lao động — Thương binh và Xã hội cấp phép hoạt động phái cử lao động quốc tế. Đây là cột mốc quan trọng cho phép Kaizen trực tiếp đưa người lao động Việt Nam sang Nhật Bản và Hàn Quốc.',
  '/__l5e/assets-v1/c52dfcf4-08e0-4b6b-aa82-5af50d4a83cc/journey-2014.jpg',
  'Người lao động Việt Nam xuất cảnh sang Nhật Bản',
  '["Giấy phép phái cử của Bộ LĐ-TB&XH","Mở rộng quy mô đào tạo","Lô lao động đầu tiên sang Nhật Bản"]'::jsonb,
  'published'),
('2018', 40, '2018-giao-duc-quoc-te',
  'Mở rộng giáo dục quốc tế',
  'Khai trương trung tâm đào tạo Nhật ngữ, Hàn ngữ chuẩn JLPT/TOPIK — tích hợp đào tạo và xuất cảnh trong cùng hệ sinh thái.',
  'Năm 2018, Kaizen khai trương các trung tâm đào tạo ngoại ngữ chuẩn JLPT (tiếng Nhật) và TOPIK (tiếng Hàn), hoàn thiện hệ sinh thái Đào tạo — Xuất cảnh — Hỗ trợ sau xuất cảnh.',
  '/__l5e/assets-v1/48b28659-0a43-42c4-89db-1bda33973788/journey-2018.jpg',
  'Lớp học tiếng Nhật tại trung tâm đào tạo Kaizen',
  '["Trung tâm JLPT chuẩn quốc tế","Trung tâm TOPIK chuẩn Hàn Quốc","Hệ sinh thái khép kín"]'::jsonb,
  'published'),
('2021', 50, '2021-mo-rong-doi-tac',
  'Mở rộng mạng lưới đối tác quốc tế',
  'Hợp tác chính thức với các nghiệp đoàn CHLB Đức, Hungary, Ba Lan, Đài Loan — vươn ra thị trường châu Âu.',
  'Năm 2021, Kaizen ký kết hợp tác chiến lược với các nghiệp đoàn tại CHLB Đức, Hungary, Ba Lan và Đài Loan, chính thức vươn ra thị trường châu Âu sau hơn một thập kỷ tập trung Đông Á.',
  '/__l5e/assets-v1/d919d912-402a-4dc2-a610-e972b872ff86/journey-2021.jpg',
  'Ký kết hợp tác giữa Kaizen và đối tác châu Âu',
  '["Ký kết với nghiệp đoàn CHLB Đức","Mở thị trường Hungary & Ba Lan","Mở rộng sang Đài Loan"]'::jsonb,
  'published'),
('2025', 60, '2025-hien-tai',
  'Thành tựu hiện tại',
  'Hệ sinh thái 5 trụ cột dịch vụ, hơn 20.000 học viên & người lao động xuất cảnh thành công, hơn 500 đối tác toàn cầu.',
  'Năm 2025, Kaizen vận hành hệ sinh thái 5 trụ cột dịch vụ: Du học, Phái cử lao động, Đào tạo ngoại ngữ, Hỗ trợ định cư và Kết nối doanh nghiệp. Hơn 20.000 học viên và người lao động đã xuất cảnh thành công với mạng lưới hơn 500 đối tác toàn cầu.',
  '/__l5e/assets-v1/794c7e59-a837-4a6a-84af-b2e5634c5c99/journey-2025.jpg',
  'Đội ngũ Kaizen hiện tại trong văn phòng quốc tế',
  '["20.000+ học viên & lao động","500+ đối tác toàn cầu","Mặt tại 10+ quốc gia","Hệ sinh thái 5 trụ cột"]'::jsonb,
  'published');

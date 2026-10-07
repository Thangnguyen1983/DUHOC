-- 1) Ẩn lead
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid,
  ADD COLUMN IF NOT EXISTS hidden_reason text;

CREATE INDEX IF NOT EXISTS idx_consultations_hidden_status
  ON public.consultations (is_hidden, status, created_at DESC);

-- 2) Giáo viên mẫu
INSERT INTO public.teachers (id, full_name, email, phone, specialization, bio, is_active)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'TRẦN THU HÀ', 'ha.tran@kaizenmanpower.com', '0912 345 678',
   'Tiếng Nhật N5–N3', 'Cử nhân Nhật Bản học, 8 năm giảng dạy tiếng Nhật cho lao động và du học sinh.', true),
  ('d1000000-0000-0000-0000-000000000002', 'LÊ MINH QUÂN', 'quan.le@kaizenmanpower.com', '0987 654 321',
   'Tiếng Trung TOCFL', 'Thạc sĩ Ngôn ngữ Trung Quốc, luyện thi TOCFL Band A–B.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teacher_documents (teacher_id, doc_type, title, file_path, file_name, note, issued_at)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'degree', '[MẪU] Bằng cử nhân Nhật Bản học',
   'mau/teachers/tran-thu-ha/bang-cu-nhan.pdf', 'bang-cu-nhan.pdf', 'Dữ liệu mẫu minh hoạ', '2016-06-20'),
  ('d1000000-0000-0000-0000-000000000001', 'certificate', '[MẪU] Chứng chỉ JLPT N1',
   'mau/teachers/tran-thu-ha/jlpt-n1.pdf', 'jlpt-n1.pdf', 'Dữ liệu mẫu minh hoạ', '2018-12-02'),
  ('d1000000-0000-0000-0000-000000000002', 'certificate', '[MẪU] Chứng chỉ TOCFL Band C',
   'mau/teachers/le-minh-quan/tocfl-c.pdf', 'tocfl-c.pdf', 'Dữ liệu mẫu minh hoạ', '2019-05-11'),
  ('725f7661-db37-4d8e-adf5-54169c34ea31', 'contract', '[MẪU] Hợp đồng giảng dạy 2026',
   'mau/teachers/nguyen-van-hung/hop-dong-2026.pdf', 'hop-dong-2026.pdf', 'Dữ liệu mẫu minh hoạ', '2026-01-05');

-- 3) Bài giảng mẫu
INSERT INTO public.lessons (program_id, class_id, title, description, content, duration_minutes, order_index, status)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001',
   '[MẪU] Bài 1: Chào hỏi và giới thiệu bản thân (A1)',
   'Từ vựng chào hỏi, cách giới thiệu tên, tuổi, nghề nghiệp.',
   E'## Mục tiêu\n- Chào hỏi theo thời điểm trong ngày\n- Giới thiệu bản thân 5 câu\n\n## Từ vựng\nGuten Morgen, Guten Tag, Ich heiße..., Ich komme aus...\n\n## Luyện tập\nThực hành hội thoại theo cặp 10 phút.',
   90, 1, 'published'),
  ('c1000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001',
   '[MẪU] Bài 2: Số đếm, thời gian và lịch hẹn',
   'Số đếm 1–100, hỏi giờ, đặt lịch hẹn đơn giản.',
   E'## Mục tiêu\n- Đọc số đếm 1–100\n- Hỏi và trả lời giờ\n\n## Bài tập về nhà\nViết 10 câu hẹn giờ khám sức khoẻ.',
   90, 2, 'published'),
  ('c1000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003',
   '[MẪU] Bài 1: Bảng chữ Hiragana',
   'Nhận diện và viết đúng 46 chữ Hiragana.',
   E'## Mục tiêu\n- Viết đúng thứ tự nét\n- Đọc trôi chảy hàng あ–の\n\n## Luyện tập\nViết mỗi chữ 10 lần.',
   120, 1, 'published'),
  ('c1000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003',
   '[MẪU] Bài 2: Katakana và từ ngoại lai',
   'Đọc tên nước, tên nghề bằng Katakana.',
   E'## Mục tiêu\n- Đọc 46 chữ Katakana\n- Ghi tên riêng bằng Katakana',
   120, 2, 'published'),
  ('c1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002',
   '[MẪU] Bài 1: Phát âm Pinyin và 4 thanh điệu',
   'Làm quen Pinyin, phân biệt 4 thanh điệu.',
   E'## Mục tiêu\n- Đọc đúng 4 thanh điệu\n- Ghép vần cơ bản',
   90, 1, 'published'),
  ('c1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002',
   '[MẪU] Bài 2: Chào hỏi và xưng hô trong công việc',
   'Mẫu câu chào hỏi tại nhà máy, công xưởng.',
   E'## Mục tiêu\n- 20 mẫu câu giao tiếp nơi làm việc',
   90, 2, 'draft');

-- 4) Tài liệu học tập mẫu
INSERT INTO public.learning_materials (program_id, class_id, title, description, category, file_name, file_path, file_type, is_public)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001',
   '[MẪU] Giáo trình Đức B1 – Học phần 1', 'Bản PDF dùng cho 10 buổi đầu.', 'giao_trinh',
   'duc-b1-hp1.pdf', 'mau/materials/duc-b1-hp1.pdf', 'application/pdf', true),
  ('c1000000-0000-0000-0000-000000000001', NULL,
   '[MẪU] Bộ 500 từ vựng tiếng Đức ngành điều dưỡng', 'Danh sách từ vựng theo chủ đề.', 'tu_vung',
   'duc-tu-vung-dieu-duong.pdf', 'mau/materials/duc-tu-vung-dieu-duong.pdf', 'application/pdf', true),
  ('c1000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003',
   '[MẪU] Giáo trình Minna no Nihongo I', 'Bản scan bài 1–10.', 'giao_trinh',
   'minna-1.pdf', 'mau/materials/minna-1.pdf', 'application/pdf', false),
  ('c1000000-0000-0000-0000-000000000003', NULL,
   '[MẪU] Bảng chữ cái Hiragana – Katakana', 'File luyện viết in khổ A4.', 'tai_lieu',
   'kana-luyen-viet.pdf', 'mau/materials/kana-luyen-viet.pdf', 'application/pdf', true),
  ('c1000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002',
   '[MẪU] Đề luyện TOCFL Band A', 'Đề thi thử kèm đáp án.', 'de_thi',
   'tocfl-a-de-1.pdf', 'mau/materials/tocfl-a-de-1.pdf', 'application/pdf', false),
  (NULL, NULL,
   '[MẪU] Nội quy lớp học Kaizen', 'Áp dụng cho toàn bộ lớp tại trung tâm.', 'noi_quy',
   'noi-quy-lop-hoc.pdf', 'mau/materials/noi-quy-lop-hoc.pdf', 'application/pdf', true);

-- 5) Bài kiểm tra mẫu
INSERT INTO public.quizzes (id, program_id, class_id, title, description, time_limit_minutes, passing_score, max_attempts, status)
VALUES
  ('d2000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001',
   '[MẪU] Kiểm tra giữa kỳ – Tiếng Đức A1', 'Gồm 3 câu trắc nghiệm mẫu.', 20, 60, 2, 'published'),
  ('d2000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003',
   '[MẪU] Kiểm tra Hiragana – Tiếng Nhật N5', 'Gồm 2 câu trắc nghiệm mẫu.', 15, 70, 3, 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, points, order_index, explanation)
VALUES
  ('d3000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', '"Guten Morgen" được dùng vào thời điểm nào?', 'single_choice', 1, 1, 'Dùng chào buổi sáng.'),
  ('d3000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 'Câu nào dùng để giới thiệu tên?', 'single_choice', 1, 2, '"Ich heiße ..." nghĩa là "Tôi tên là ...".'),
  ('d3000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000001', 'Số "zwanzig" là số mấy?', 'single_choice', 1, 3, 'zwanzig = 20.'),
  ('d3000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000002', 'Chữ あ đọc là gì?', 'single_choice', 1, 1, 'あ đọc là "a".'),
  ('d3000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000002', 'Bảng chữ nào dùng viết từ ngoại lai?', 'single_choice', 1, 2, 'Katakana dùng cho từ mượn.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_options (question_id, option_text, is_correct, order_index)
VALUES
  ('d3000000-0000-0000-0000-000000000001', 'Buổi sáng', true, 1),
  ('d3000000-0000-0000-0000-000000000001', 'Buổi trưa', false, 2),
  ('d3000000-0000-0000-0000-000000000001', 'Buổi tối', false, 3),
  ('d3000000-0000-0000-0000-000000000002', 'Ich heiße Nam', true, 1),
  ('d3000000-0000-0000-0000-000000000002', 'Danke schön', false, 2),
  ('d3000000-0000-0000-0000-000000000002', 'Auf Wiedersehen', false, 3),
  ('d3000000-0000-0000-0000-000000000003', '12', false, 1),
  ('d3000000-0000-0000-0000-000000000003', '20', true, 2),
  ('d3000000-0000-0000-0000-000000000003', '30', false, 3),
  ('d3000000-0000-0000-0000-000000000004', 'a', true, 1),
  ('d3000000-0000-0000-0000-000000000004', 'i', false, 2),
  ('d3000000-0000-0000-0000-000000000004', 'u', false, 3),
  ('d3000000-0000-0000-0000-000000000005', 'Hiragana', false, 1),
  ('d3000000-0000-0000-0000-000000000005', 'Katakana', true, 2),
  ('d3000000-0000-0000-0000-000000000005', 'Kanji', false, 3);

-- 6) Vị trí kho lưu trữ mẫu
INSERT INTO public.archive_locations (code, name, warehouse, room, cabinet, shelf, box, capacity, note, is_active)
VALUES
  ('KHO-A-P1-T1-K1', '[MẪU] Kho A – Phòng 1 – Tủ 1 – Kệ 1', 'Kho A (Trụ sở Hà Nội)', 'Phòng lưu trữ 1', 'Tủ 1', 'Kệ 1', 'Hộp 01', 120, 'Hồ sơ học viên đang xử lý', true),
  ('KHO-A-P1-T1-K2', '[MẪU] Kho A – Phòng 1 – Tủ 1 – Kệ 2', 'Kho A (Trụ sở Hà Nội)', 'Phòng lưu trữ 1', 'Tủ 1', 'Kệ 2', 'Hộp 02', 120, 'Hồ sơ đã xuất cảnh', true),
  ('KHO-B-P2-T3-K1', '[MẪU] Kho B – Phòng 2 – Tủ 3 – Kệ 1', 'Kho B (Chi nhánh)', 'Phòng lưu trữ 2', 'Tủ 3', 'Kệ 1', 'Hộp 05', 80, 'Hồ sơ lưu dài hạn', true)
ON CONFLICT (code) DO NOTHING;
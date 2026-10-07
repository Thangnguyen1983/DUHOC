UPDATE public.student_profiles
SET user_id = 'a68acd97-2493-4ce5-8859-c61b2b6372c9'
WHERE id = '2b6ee175-a887-42c9-abce-bc0b34b6f1d9' AND user_id IS NULL;

INSERT INTO public.student_account_links (student_profile_id, user_id, method, note)
VALUES ('2b6ee175-a887-42c9-abce-bc0b34b6f1d9', 'a68acd97-2493-4ce5-8859-c61b2b6372c9', 'admin_manual', 'Quản trị nối thủ công tài khoản phongveuyensuong07@gmail.com vào hồ sơ KZ26129943');
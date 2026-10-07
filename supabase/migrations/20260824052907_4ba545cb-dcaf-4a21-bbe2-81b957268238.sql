INSERT INTO public.training_enrollments (class_id, student_profile_id, status, note)
SELECT 'c2000000-0000-0000-0000-000000000001'::uuid, sp.id, 'active', 'Ghi danh theo yêu cầu quản trị'
FROM public.student_profiles sp
WHERE sp.student_code = 'KZ26129943'
  AND NOT EXISTS (
    SELECT 1 FROM public.training_enrollments e
    WHERE e.class_id = 'c2000000-0000-0000-0000-000000000001'::uuid
      AND e.student_profile_id = sp.id
  );

WITH ins AS (
  INSERT INTO public.student_profiles (
    consultation_id, full_name, phone, email, program, country, current_status, meta
  )
  SELECT
    c.id, c.full_name, c.phone, c.email, c.program, c.market,
    'lead_contacted',
    jsonb_build_object('source', c.source, 'message', c.message, 'lead_status', c.status, 'backfilled', true)
  FROM public.consultations c
  WHERE c.status IN ('contacted','qualified','converted','done')
    AND c.student_profile_id IS NULL
  RETURNING id, consultation_id
)
UPDATE public.consultations c
SET student_profile_id = ins.id
FROM ins
WHERE ins.consultation_id = c.id;

INSERT INTO public.student_status_history (student_profile_id, from_status, to_status, note)
SELECT sp.id, NULL, 'lead_contacted',
       'Backfill: Tự động tạo hồ sơ HV từ Lead cũ (' || COALESCE(sp.meta->>'lead_status','?') || ')'
FROM public.student_profiles sp
WHERE (sp.meta->>'backfilled')::boolean IS TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.student_status_history h WHERE h.student_profile_id = sp.id
  );

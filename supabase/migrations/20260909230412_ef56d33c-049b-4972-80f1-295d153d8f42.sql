DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'student_profiles','workflow_instances','workflow_step_logs','training_classes',
    'training_sessions','training_enrollments','training_attendance','training_grades',
    'certificates','account_provision_queue','course_orders','course_enrollments',
    'cms_entries','notifications','student_archive_records','student_status_history'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
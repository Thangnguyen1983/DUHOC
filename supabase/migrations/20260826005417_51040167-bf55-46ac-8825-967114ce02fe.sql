ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS free_resources jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS free_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS min_watch_seconds integer NOT NULL DEFAULT 0;

ALTER TABLE public.course_lesson_progress
  ADD COLUMN IF NOT EXISTS completion_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS completion_note text;

DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'training_staff';
EXCEPTION WHEN others THEN NULL; END $$;

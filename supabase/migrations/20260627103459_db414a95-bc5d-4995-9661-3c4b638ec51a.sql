
-- ========== PHA 3: TRAINING CORE ==========
-- Bước 1: Tạo bảng (không kèm policy)

CREATE TABLE public.training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  language text,
  level text,
  market text,
  total_hours integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  tuition_fee numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'VND',
  is_active boolean DEFAULT true,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.training_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.training_programs(id) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  schedule text,
  room text,
  max_students integer DEFAULT 30,
  status text NOT NULL DEFAULT 'planning',
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.training_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.training_classes(id) ON DELETE CASCADE,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  final_grade numeric(5,2),
  certificate_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_profile_id)
);

CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.training_classes(id) ON DELETE CASCADE,
  session_no integer NOT NULL,
  title text,
  topic text,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'scheduled',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, session_no)
);

CREATE TABLE public.training_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  check_in_at timestamptz,
  note text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, enrollment_id)
);

CREATE TABLE public.training_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.training_enrollments(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  title text,
  score numeric(5,2),
  max_score numeric(5,2) DEFAULT 10,
  weight numeric(5,2) DEFAULT 1,
  assessed_at date DEFAULT CURRENT_DATE,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Bước 2: GRANT
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_programs TO authenticated;
GRANT SELECT ON public.training_programs TO anon;
GRANT ALL ON public.training_programs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_classes TO authenticated;
GRANT ALL ON public.training_classes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_enrollments TO authenticated;
GRANT ALL ON public.training_enrollments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_sessions TO authenticated;
GRANT ALL ON public.training_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_attendance TO authenticated;
GRANT ALL ON public.training_attendance TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_grades TO authenticated;
GRANT ALL ON public.training_grades TO service_role;

-- Bước 3: Enable RLS
ALTER TABLE public.training_programs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_classes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_grades     ENABLE ROW LEVEL SECURITY;

-- Bước 4: Policies
-- programs
CREATE POLICY "Public read active programs" ON public.training_programs
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));
CREATE POLICY "Admin/TM manage programs" ON public.training_programs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

-- classes
CREATE POLICY "Staff read classes" ON public.training_classes
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'cskh')
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.training_enrollments e
               JOIN public.student_profiles sp ON sp.id = e.student_profile_id
               WHERE e.class_id = training_classes.id AND sp.user_id = auth.uid())
  );
CREATE POLICY "TM manage classes" ON public.training_classes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

-- enrollments
CREATE POLICY "Staff read enrollments" ON public.training_enrollments
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'cskh')
    OR EXISTS (SELECT 1 FROM public.training_classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = student_profile_id AND sp.user_id = auth.uid())
  );
CREATE POLICY "TM manage enrollments" ON public.training_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

-- sessions
CREATE POLICY "Staff read sessions" ON public.training_sessions
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'cskh')
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.training_classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.training_enrollments e
               JOIN public.student_profiles sp ON sp.id = e.student_profile_id
               WHERE e.class_id = training_sessions.class_id AND sp.user_id = auth.uid())
  );
CREATE POLICY "TM/Teacher manage sessions" ON public.training_sessions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.training_classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR teacher_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.training_classes c WHERE c.id = class_id AND c.teacher_id = auth.uid())
  );

-- attendance
CREATE POLICY "Staff read attendance" ON public.training_attendance
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'cskh')
    OR EXISTS (
      SELECT 1 FROM public.training_sessions s
      JOIN public.training_classes c ON c.id = s.class_id
      WHERE s.id = session_id AND (c.teacher_id = auth.uid() OR s.teacher_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.training_enrollments e
      JOIN public.student_profiles sp ON sp.id = e.student_profile_id
      WHERE e.id = enrollment_id AND sp.user_id = auth.uid()
    )
  );
CREATE POLICY "Teacher/TM write attendance" ON public.training_attendance
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR EXISTS (
      SELECT 1 FROM public.training_sessions s
      JOIN public.training_classes c ON c.id = s.class_id
      WHERE s.id = session_id AND (c.teacher_id = auth.uid() OR s.teacher_id = auth.uid())
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR EXISTS (
      SELECT 1 FROM public.training_sessions s
      JOIN public.training_classes c ON c.id = s.class_id
      WHERE s.id = session_id AND (c.teacher_id = auth.uid() OR s.teacher_id = auth.uid())
    )
  );

-- grades
CREATE POLICY "Staff read grades" ON public.training_grades
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'cskh')
    OR EXISTS (
      SELECT 1 FROM public.training_enrollments e
      JOIN public.training_classes c ON c.id = e.class_id
      WHERE e.id = enrollment_id AND c.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.training_enrollments e
      JOIN public.student_profiles sp ON sp.id = e.student_profile_id
      WHERE e.id = enrollment_id AND sp.user_id = auth.uid()
    )
  );
CREATE POLICY "Teacher/TM write grades" ON public.training_grades
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR EXISTS (
      SELECT 1 FROM public.training_enrollments e
      JOIN public.training_classes c ON c.id = e.class_id
      WHERE e.id = enrollment_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'training_manager')
    OR EXISTS (
      SELECT 1 FROM public.training_enrollments e
      JOIN public.training_classes c ON c.id = e.class_id
      WHERE e.id = enrollment_id AND c.teacher_id = auth.uid()
    )
  );

-- Bước 5: triggers updated_at
CREATE TRIGGER trg_training_programs_updated   BEFORE UPDATE ON public.training_programs   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_training_classes_updated    BEFORE UPDATE ON public.training_classes    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_training_enrollments_updated BEFORE UPDATE ON public.training_enrollments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_training_sessions_updated   BEFORE UPDATE ON public.training_sessions   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_training_attendance_updated BEFORE UPDATE ON public.training_attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_training_grades_updated     BEFORE UPDATE ON public.training_grades     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bước 6: indexes
CREATE INDEX idx_training_classes_program    ON public.training_classes(program_id);
CREATE INDEX idx_training_classes_teacher    ON public.training_classes(teacher_id);
CREATE INDEX idx_training_enrollments_class  ON public.training_enrollments(class_id);
CREATE INDEX idx_training_enrollments_student ON public.training_enrollments(student_profile_id);
CREATE INDEX idx_training_sessions_class     ON public.training_sessions(class_id);
CREATE INDEX idx_training_sessions_date      ON public.training_sessions(session_date);
CREATE INDEX idx_training_attendance_session ON public.training_attendance(session_id);
CREATE INDEX idx_training_attendance_enroll  ON public.training_attendance(enrollment_id);
CREATE INDEX idx_training_grades_enrollment  ON public.training_grades(enrollment_id);

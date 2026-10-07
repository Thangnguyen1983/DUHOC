DO $$
DECLARE
  v_cons uuid; v_sp uuid; v_enr uuid; v_class uuid := 'c2000000-0000-0000-0000-000000000001';
  v_def uuid; v_inst uuid; v_prev text; v_st text; v_i int := 0; s record;
  v_statuses text[] := ARRAY['lead_new','lead_contacted','consulting','profile_created','contract_pending','contract_signed','class_pending','training','exam_pending','training_passed','transfer_visa','visa_processing','visa_granted','departure_pending','departed','post_departure','completed'];
  v_base timestamptz := now() - interval '300 days';
BEGIN
  SELECT id INTO v_def FROM public.workflow_definitions WHERE is_active LIMIT 1;

  INSERT INTO public.consultations (full_name, phone, email, program, market, message, status, source, campaign_code, utm_source, utm_medium, utm_campaign, created_at)
  VALUES ('[DEMO] Trần Minh Khoa','0900000199','demo.khoa@kaizen-demo.local','Du học nghề Đức – Điều dưỡng','germany','Em muốn tư vấn lộ trình du học nghề Đức.','converted','form','KZ-DE-2025','facebook','cpc','duhoc-duc-2025', v_base)
  RETURNING id INTO v_cons;

  INSERT INTO public.student_profiles (consultation_id, full_name, phone, email, dob, country, program, current_status, source, gender, nationality, id_type, id_no, id_issue_date, id_issue_place, place_of_origin, place_of_residence, contract_status, visa_status, departure_status, post_departure_status, meta, created_at)
  VALUES (v_cons,'[DEMO] Trần Minh Khoa','0900000199','demo.khoa@kaizen-demo.local','2004-05-18','germany','Du học nghề Đức – Điều dưỡng','completed','form','male','Việt Nam','cccd','038204001199','2022-03-10','Cục CSQLHC về TTXH','Thanh Hoá','Hà Nội','signed','granted','departed','working', jsonb_build_object('demo', true), v_base)
  RETURNING id INTO v_sp;

  UPDATE public.consultations SET student_profile_id = v_sp WHERE id = v_cons;

  SELECT id INTO v_inst FROM public.workflow_instances WHERE student_profile_id = v_sp LIMIT 1;
  IF v_inst IS NULL AND v_def IS NOT NULL THEN
    INSERT INTO public.workflow_instances (definition_id, student_profile_id, current_step, status, started_at)
    VALUES (v_def, v_sp, 'lead_new', 'active', v_base) RETURNING id INTO v_inst;
  END IF;

  FOREACH v_st IN ARRAY v_statuses LOOP
    INSERT INTO public.student_status_history (student_profile_id, from_status, to_status, note, created_at)
    VALUES (v_sp, v_prev, v_st, '[DEMO] Chuyển trạng thái tự động', v_base + (v_i * interval '15 days'));
    IF v_inst IS NOT NULL THEN
      INSERT INTO public.workflow_step_logs (instance_id, student_profile_id, step_key, from_status, to_status, note, occurred_at)
      VALUES (v_inst, v_sp, v_st, v_prev, v_st, '[DEMO] Hoàn tất bước', v_base + (v_i * interval '15 days'));
    END IF;
    v_prev := v_st; v_i := v_i + 1;
  END LOOP;

  IF v_inst IS NOT NULL THEN
    UPDATE public.workflow_instances SET current_step='completed', status='done', completed_at = v_base + (v_i * interval '15 days') WHERE id = v_inst;
  END IF;

  INSERT INTO public.student_care_logs (student_profile_id, channel, content, created_at) VALUES
    (v_sp,'call','[DEMO] Gọi tư vấn lần 1, khách quan tâm ngành điều dưỡng.', v_base + interval '1 day'),
    (v_sp,'zalo','[DEMO] Gửi lộ trình học tiếng và chi phí.', v_base + interval '5 days'),
    (v_sp,'meeting','[DEMO] Gặp trực tiếp ký hợp đồng đào tạo.', v_base + interval '60 days'),
    (v_sp,'call','[DEMO] Nhắc lịch phỏng vấn xin visa.', v_base + interval '190 days');

  INSERT INTO public.student_documents (student_profile_id, doc_type, file_path, file_name, mime_type, size_bytes, verified, verified_at, note, created_at) VALUES
    (v_sp,'passport','demo/khoa-passport.jpg','passport.jpg','image/jpeg',204800,true, v_base + interval '40 days','[DEMO] Hộ chiếu hợp lệ', v_base + interval '39 days'),
    (v_sp,'cccd','demo/khoa-cccd.jpg','cccd.jpg','image/jpeg',180000,true, v_base + interval '40 days','[DEMO] CCCD', v_base + interval '39 days'),
    (v_sp,'certificate','demo/khoa-b1.pdf','chung-chi-b1.pdf','application/pdf',320000,true, v_base + interval '200 days','[DEMO] Chứng chỉ B1', v_base + interval '199 days');

  UPDATE public.student_document_checklist
     SET status = 'verified', note = '[DEMO] Đã duyệt', reviewed_at = v_base + interval '45 days'
   WHERE student_profile_id = v_sp;

  INSERT INTO public.training_enrollments (class_id, student_profile_id, enrolled_at, status, final_grade, note)
  VALUES (v_class, v_sp, v_base + interval '75 days', 'completed', 8.4, '[DEMO] Hoàn thành khoá B1')
  RETURNING id INTO v_enr;

  FOR s IN SELECT id, session_no FROM public.training_sessions WHERE class_id = v_class ORDER BY session_no LOOP
    INSERT INTO public.training_attendance (session_id, enrollment_id, status, check_in_at, check_in_method, note, pending)
    VALUES (s.id, v_enr, CASE WHEN s.session_no % 11 = 0 THEN 'absent' WHEN s.session_no % 7 = 0 THEN 'late' ELSE 'present' END,
            v_base + interval '75 days' + (s.session_no * interval '3 days'), 'qr', '[DEMO]', false);
  END LOOP;

  INSERT INTO public.training_grades (enrollment_id, assessment_type, title, score, max_score, weight, assessed_at, comment) VALUES
    (v_enr,'quiz','[DEMO] Kiểm tra A1', 8.0, 10, 0.2, (v_base + interval '110 days')::date,'Tốt'),
    (v_enr,'midterm','[DEMO] Giữa kỳ A2', 8.5, 10, 0.3, (v_base + interval '150 days')::date,'Khá tốt'),
    (v_enr,'final','[DEMO] Thi cuối khoá B1', 8.6, 10, 0.5, (v_base + interval '195 days')::date,'Đạt B1');

  INSERT INTO public.certificates (certificate_number, verify_code, student_profile_id, program_id, class_id, title, recipient_name, issued_at, status, meta)
  SELECT 'KZ-DEMO-'||to_char(now(),'YYYY')||'-0001', 'DEMOKHOA01', v_sp, c.program_id, v_class, 'Chứng chỉ tiếng Đức B1', '[DEMO] Trần Minh Khoa', v_base + interval '205 days', 'issued', jsonb_build_object('demo', true)
  FROM public.training_classes c WHERE c.id = v_class;
END $$;
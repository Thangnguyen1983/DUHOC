
CREATE POLICY course_order_items_own_insert ON public.course_order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE POLICY course_enrollments_own_insert ON public.course_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY course_enrollments_own_update ON public.course_enrollments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

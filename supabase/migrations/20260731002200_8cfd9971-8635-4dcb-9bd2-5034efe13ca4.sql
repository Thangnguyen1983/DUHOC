
CREATE POLICY "Marketing manage chatbot_knowledge" ON public.chatbot_knowledge FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'marketing')) WITH CHECK (public.has_role(auth.uid(), 'marketing'));
CREATE POLICY "Marketing manage chatbot_prompts" ON public.chatbot_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'marketing')) WITH CHECK (public.has_role(auth.uid(), 'marketing'));
CREATE POLICY "Marketing manage chatbot_training" ON public.chatbot_training FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'marketing')) WITH CHECK (public.has_role(auth.uid(), 'marketing'));
CREATE POLICY "Marketing read chat_conversations" ON public.chat_conversations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'marketing'));
CREATE POLICY "Marketing read chat_messages" ON public.chat_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'marketing'));

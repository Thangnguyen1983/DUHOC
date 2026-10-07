
CREATE TABLE public.chatbot_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  context_summary text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  scope_allow text NOT NULL DEFAULT '',
  scope_deny text NOT NULL DEFAULT '',
  tone_style text NOT NULL DEFAULT 'professional',
  address_user text NOT NULL DEFAULT 'anh/chị',
  address_self text NOT NULL DEFAULT 'Kaizen',
  max_sentences integer NOT NULL DEFAULT 6,
  max_words_per_sentence integer NOT NULL DEFAULT 20,
  use_emoji boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'vi',
  extra_rules text NOT NULL DEFAULT '',
  sample_qa jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbot_training TO authenticated;
GRANT ALL ON public.chatbot_training TO service_role;

ALTER TABLE public.chatbot_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chatbot_training"
  ON public.chatbot_training
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_chatbot_training_updated_at
  BEFORE UPDATE ON public.chatbot_training
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 1. Chatbot Knowledge Base
CREATE TYPE chatbot_category AS ENUM ('du_hoc','xkld','ngoai_ngu','outsourcing','cong_ty','phap_ly','khac');
CREATE TYPE chatbot_kb_status AS ENUM ('draft','pending','approved','archived');

CREATE TABLE public.chatbot_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category chatbot_category NOT NULL DEFAULT 'khac',
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  priority int NOT NULL DEFAULT 0,
  status chatbot_kb_status NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbot_knowledge TO authenticated;
GRANT ALL ON public.chatbot_knowledge TO service_role;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chatbot_knowledge"
  ON public.chatbot_knowledge FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_chatbot_knowledge_updated_at
  BEFORE UPDATE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chatbot_kb_status_active ON public.chatbot_knowledge(status, is_active);
CREATE INDEX idx_chatbot_kb_category ON public.chatbot_knowledge(category);

-- 2. Chatbot Prompts (versioning)
CREATE TABLE public.chatbot_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version int NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbot_prompts TO authenticated;
GRANT ALL ON public.chatbot_prompts TO service_role;
ALTER TABLE public.chatbot_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chatbot_prompts"
  ON public.chatbot_prompts FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_chatbot_prompts_updated_at
  BEFORE UPDATE ON public.chatbot_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX idx_chatbot_prompts_one_active
  ON public.chatbot_prompts(is_active) WHERE is_active = true;

-- 3. Chat conversations + messages (analytics)
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  message_count int NOT NULL DEFAULT 0,
  lead_captured boolean NOT NULL DEFAULT false,
  user_agent text,
  ip_hash text,
  flagged_for_training boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read chat_conversations"
  ON public.chat_conversations FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  has_cta boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read chat_messages"
  ON public.chat_messages FOR SELECT
  USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_chat_messages_conv ON public.chat_messages(conversation_id, created_at);

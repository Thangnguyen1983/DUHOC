
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'form';
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS conversation_id uuid NULL;
ALTER TABLE public.consultations ADD CONSTRAINT consultations_source_check CHECK (source IN ('form','chatbot'));

-- Add updated_at for chat_conversations
ALTER TABLE public.chat_conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER TABLE public.consultations REPLICA IDENTITY FULL;

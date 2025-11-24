-- Add missing columns to conversations table
ALTER TABLE public.conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
ALTER TABLE public.conversations ADD COLUMN course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN subject TEXT;

-- Add missing column to conversation_participants
ALTER TABLE public.conversation_participants ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Add trigger for conversations updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
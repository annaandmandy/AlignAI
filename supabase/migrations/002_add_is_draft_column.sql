-- Add is_draft column to responses table
ALTER TABLE public.responses
ADD COLUMN is_draft BOOLEAN DEFAULT false NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_responses_is_draft ON public.responses(is_draft);

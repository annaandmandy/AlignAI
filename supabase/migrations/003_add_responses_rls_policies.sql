-- Enable RLS on responses table (if not already enabled)
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view responses in their team projects" ON public.responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON public.responses;
DROP POLICY IF EXISTS "Users can delete their own responses" ON public.responses;

-- Policy: Users can view responses for projects in their teams
CREATE POLICY "Users can view responses in their team projects"
  ON public.responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON s.project_id = p.id
      JOIN public.team_members tm ON p.team_id = tm.team_id
      WHERE s.id = responses.section_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own responses
CREATE POLICY "Users can insert their own responses"
  ON public.responses FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON s.project_id = p.id
      JOIN public.team_members tm ON p.team_id = tm.team_id
      WHERE s.id = responses.section_id
      AND tm.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own responses
CREATE POLICY "Users can update their own responses"
  ON public.responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own responses
CREATE POLICY "Users can delete their own responses"
  ON public.responses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

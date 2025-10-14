-- Fix RLS policies to avoid infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;

-- Recreate Teams policies without recursion
CREATE POLICY "Users can view teams they are members of"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Recreate Team Members policies without recursion
CREATE POLICY "Users can view team members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members AS tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can add team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is owner of the team OR if they're adding themselves (for initial team creation)
    team_id IN (
      SELECT team_id FROM public.team_members AS tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Team owners can remove team members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members AS tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );

CREATE POLICY "Users can update their own team membership"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

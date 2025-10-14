# Simple RLS Fix - The Real Solution

## The Problem

When you try to create a team:
1. You insert into `teams` table ✅ (works fine)
2. You try to insert into `team_members` ❌ (fails!)
3. Why? The RLS policy checks if you're already a member
4. But you can't be a member until you insert... **Infinite recursion!**

## The Solution

Make the `team_members` INSERT policy allow users to add themselves **without** checking existing membership.

## Run This SQL in Supabase

Go to **Supabase Dashboard → SQL Editor → New Query**, paste this, and click **Run**:

```sql
-- ============================================
-- SIMPLE FIX: Allow users to add themselves to teams
-- ============================================

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Users can add team members" ON public.team_members;

-- Create a new, simpler INSERT policy
CREATE POLICY "Allow users to add themselves or owners to add others"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- FIRST: Allow anyone to add themselves (needed for team creation)
    auth.uid() = user_id
    OR
    -- SECOND: Allow owners to add others (for invitations later)
    EXISTS (
      SELECT 1 FROM public.team_members AS existing
      WHERE existing.team_id = team_members.team_id
      AND existing.user_id = auth.uid()
      AND existing.role = 'owner'
    )
  );
```

## What This Does

**Before (Broken):**
```sql
-- This checked if you're already a member
-- But you can't be a member until you insert!
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
)
```

**After (Fixed):**
```sql
-- This allows you to add yourself WITHOUT checking if you're already a member
WITH CHECK (
  auth.uid() = user_id  -- ✅ Just check if you're adding yourself
  OR
  -- For later: owners can add others
  EXISTS (...)
)
```

## After Running This

1. Refresh your browser
2. Try creating a team
3. ✅ Should work!

## Why This Works

- **auth.uid() = user_id**: Allows you to add yourself to any team
- No circular dependency: Doesn't check `team_members` when inserting into `team_members`
- The `EXISTS` clause only runs if you're NOT adding yourself (so no recursion when creating teams)

## Full Clean Policies (Optional - Only if you want to reset everything)

If you want to reset ALL policies cleanly, run this instead:

```sql
-- ============================================
-- COMPLETE RLS RESET (OPTIONAL)
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Users can add team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow users to add themselves or owners to add others" ON public.team_members;

-- ============================================
-- TEAMS TABLE - Simple and Clean
-- ============================================

CREATE POLICY "Anyone can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users see teams they belong to"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can delete teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- TEAM_MEMBERS TABLE - No Recursion!
-- ============================================

CREATE POLICY "Users see members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves or owners add others"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id  -- Key fix: no recursion!
    OR
    EXISTS (
      SELECT 1 FROM public.team_members AS existing
      WHERE existing.team_id = team_members.team_id
      AND existing.user_id = auth.uid()
      AND existing.role = 'owner'
    )
  );

CREATE POLICY "Owners can remove members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'owner'
    )
  );

CREATE POLICY "Members can update themselves, owners can update anyone"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    team_id IN (
      SELECT tm.team_id FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'owner'
    )
  );
```

## Test After Running

1. Refresh browser (Ctrl+Shift+R)
2. Go to http://localhost:3000/teams
3. Click "Create Team"
4. Enter team name
5. Click "Create Team"
6. ✅ Should work without errors!

## The Key Insight

The problem was **NOT** the Supabase client. The client is fine.

The problem was the RLS policy checking `team_members` while inserting into `team_members`.

The fix: **Just check if `auth.uid() = user_id`** - no table lookups needed!

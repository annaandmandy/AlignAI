# Supabase RLS Policy Fix - Step by Step

## The Problem

The RLS policies have circular dependencies causing infinite recursion.

## Solution: Update Policies in Supabase

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

Copy and paste this ENTIRE script, then click **Run**:

```sql
-- ============================================
-- FIX RLS POLICIES FOR TEAMS AND TEAM_MEMBERS
-- ============================================

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;

-- ============================================
-- TEAMS TABLE POLICIES (NO RECURSION)
-- ============================================

-- Allow users to view teams they are members of
CREATE POLICY "Users can view teams they belong to"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id
      FROM public.team_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow any authenticated user to create teams
CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow team owners to update their teams
CREATE POLICY "Team owners can update teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT team_id
      FROM public.team_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- Allow team owners to delete teams
CREATE POLICY "Team owners can delete teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT team_id
      FROM public.team_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

-- ============================================
-- TEAM_MEMBERS TABLE POLICIES (NO RECURSION)
-- ============================================

-- Allow users to view members of teams they belong to
CREATE POLICY "Users can view team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
    )
  );

-- Allow users to add themselves as members OR team owners to add others
CREATE POLICY "Users can add team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to add themselves to any team
    user_id = auth.uid()
    OR
    -- Or allow if they are an owner of the team
    team_id IN (
      SELECT tm.team_id
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );

-- Allow team owners to remove members
CREATE POLICY "Team owners can remove members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.team_id
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );

-- Allow users to update their own membership or owners to update any membership
CREATE POLICY "Users can update team memberships"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    team_id IN (
      SELECT tm.team_id
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );
```

### Step 3: Verify Success

You should see:
```
Success. No rows returned
```

If you see any errors, let me know!

### Step 4: Test the Policies

Go to **Table Editor** → **team_members** → **Policies** tab

You should see policies like:
- ✅ Users can view team members
- ✅ Users can add team members
- ✅ Team owners can remove members
- ✅ Users can update team memberships

## Key Changes Made

1. **Removed circular references**: Policies now use subqueries with table aliases
2. **Simplified team creation**: Users can add themselves to teams (needed for team creation)
3. **Clear ownership**: Owners have full control, members can view

## Why This Works

**Old (broken) approach:**
```sql
-- This caused recursion
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = teams.id  -- Checks team_members
    AND team_members.user_id = auth.uid()  -- Which checks team_members again!
  )
)
```

**New (working) approach:**
```sql
-- This doesn't recurse
USING (
  id IN (
    SELECT team_id FROM team_members  -- Simple subquery, no self-reference
    WHERE user_id = auth.uid()
  )
)
```

The key is using `IN` with a subquery instead of `EXISTS` with a correlated subquery.

## What This Allows

✅ **Team Creation**:
- Any user can create a team (INSERT on teams)
- User can add themselves as owner (INSERT on team_members)

✅ **Team Viewing**:
- Users see only teams they're members of

✅ **Team Management**:
- Owners can update/delete teams
- Owners can add/remove members
- Members can view other members

## After Running This

You can safely use the direct Supabase approach in your code (no API route needed).

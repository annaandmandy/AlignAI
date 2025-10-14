# How to Fix the RLS Error - Step by Step

## ✅ Code Updated

I've reverted the code back to use direct Supabase interaction (no API route).

**File changed:** `components/teams/CreateTeamModal.tsx` ✅

## 🔧 Now You Need to Fix Supabase Policies

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com
2. Click on your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Run This SQL

**Copy this ENTIRE script:**

```sql
-- ============================================
-- FIX RLS POLICIES FOR TEAMS AND TEAM_MEMBERS
-- ============================================

-- Drop the old problematic policies
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view other team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members" ON public.team_members;

-- ============================================
-- NEW TEAMS POLICIES (NO RECURSION)
-- ============================================

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

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

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
-- NEW TEAM_MEMBERS POLICIES (NO RECURSION)
-- ============================================

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

CREATE POLICY "Users can add team members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR
    team_id IN (
      SELECT tm.team_id
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );

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

### Step 3: Execute

1. **Paste** the entire SQL above into the editor
2. **Click "Run"** (or press Cmd/Ctrl + Enter)
3. Wait for "Success. No rows returned"

### Step 4: Verify

Go to **Table Editor** → **teams** → **Policies** tab

You should see these policies:
- ✅ Users can view teams they belong to
- ✅ Authenticated users can create teams
- ✅ Team owners can update teams
- ✅ Team owners can delete teams

### Step 5: Test Team Creation

1. Refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Go to http://localhost:3000/teams
3. Click "Create Team"
4. Enter a team name
5. Click "Create Team"
6. ✅ Should work without errors!

## 🔍 What Changed

### Before (Broken):
```sql
-- This caused infinite recursion
EXISTS (
  SELECT 1 FROM team_members
  WHERE team_members.team_id = teams.id
  AND team_members.user_id = auth.uid()
)
```

### After (Fixed):
```sql
-- This doesn't recurse
id IN (
  SELECT team_id FROM team_members
  WHERE user_id = auth.uid()
)
```

## ✅ Checklist

- [ ] SQL ran successfully in Supabase
- [ ] Refreshed browser
- [ ] Can create team without errors
- [ ] Team appears in the list
- [ ] No console errors
- [ ] Can click team card to view details

## 🚨 If Still Not Working

1. **Check browser console** (F12) for errors
2. **Check Supabase logs**:
   - Dashboard → Logs
   - Look for RLS errors
3. **Verify policies exist**:
   - Table Editor → teams → Policies
   - Should see 4 policies for teams
   - Should see 4 policies for team_members

## Need Help?

If you see any errors after running the SQL, copy the error message and let me know!

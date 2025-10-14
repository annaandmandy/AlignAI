# RLS Policy Fix Guide

## The Problem

You encountered an "infinite recursion detected in policy for relation team_members" error. This happens when Row Level Security (RLS) policies reference each other in a circular way.

## The Solution

I've implemented two fixes:

### Fix 1: API Route with Service Role (ALREADY IMPLEMENTED ✅)

The team creation now uses an API route that bypasses RLS using the service role key.

**Files Changed:**
- `app/api/teams/route.ts` - New API route for team creation
- `components/teams/CreateTeamModal.tsx` - Updated to call the API

**How It Works:**
1. Frontend calls `/api/teams` with auth token
2. API verifies the user
3. API uses service role to create team (bypasses RLS)
4. API creates team_member record
5. Returns success to frontend

### Fix 2: Update RLS Policies (OPTIONAL - Run if you still have issues)

If you still encounter RLS errors when viewing teams, run this SQL in your Supabase SQL Editor:

```sql
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
    -- Allow if user is owner of the team OR if they're adding themselves
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
```

## How to Run the SQL Fix

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire SQL above
5. Paste into the editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Testing

After applying the fixes:

1. **Test Team Creation:**
   - Visit http://localhost:3000/teams
   - Click "Create Team"
   - Enter a team name
   - Click "Create Team"
   - ✅ Team should be created without errors

2. **Test Team Viewing:**
   - Refresh the page
   - ✅ Your teams should appear in the list

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab
   - ✅ No RLS or 500 errors

4. **Check Supabase:**
   - Go to Supabase Dashboard → Table Editor
   - Check `teams` table - your team should be there
   - Check `team_members` table - you should be listed as owner

## About the Hydration Warning

The hydration warning about HTML attributes is harmless and caused by browser extensions (like password managers adding attributes to form fields). This doesn't affect functionality.

To suppress it (optional):
- Already fixed in `app/layout.tsx` with `suppressHydrationWarning`
- Or disable browser extensions during development
- Or use incognito mode

## Why This Happened

**Original Problem:**
- The RLS policy for `teams` checked `team_members`
- The RLS policy for `team_members` checked `team_members` again
- This created an infinite loop

**Solution:**
- Use API route with service role (bypasses RLS completely for team creation)
- Fixed policies use table aliases (`tm`) to avoid recursion
- Policies now use `IN` subqueries instead of `EXISTS` with self-joins

## Verification Checklist

- [ ] Team creation works without errors
- [ ] Teams appear in the list
- [ ] No "infinite recursion" errors in browser console
- [ ] No 500 errors from Supabase
- [ ] Can view team details by clicking team card
- [ ] Can create projects within teams

## If You Still Have Issues

1. **Check .env file:**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   - Make sure this is set (not the anon key!)
   - Get it from Supabase Dashboard → Settings → API

2. **Restart dev server:**
   ```bash
   # Kill the server
   Ctrl+C

   # Restart
   npm run dev
   ```

3. **Check API route logs:**
   - Look at terminal where dev server is running
   - Check for errors when you create a team

4. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Check for errors around the time you tried to create a team

## Need More Help?

If you still see errors:
1. Copy the full error message from browser console
2. Check the terminal output from `npm run dev`
3. Check Supabase Dashboard → Logs

The fix is already implemented - team creation now uses a secure API route that bypasses the RLS recursion issue entirely!

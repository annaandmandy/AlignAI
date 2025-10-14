# Authentication Testing Guide

Your authentication system is now complete and ready to test! 🎉

## What Was Built

### Pages Created
- ✅ **[/signup](http://localhost:3000/signup)** - Beautiful signup page with validation
- ✅ **[/login](http://localhost:3000/login)** - Clean login page
- ✅ **[/teams](http://localhost:3000/teams)** - Protected dashboard (requires login)

### Features Implemented
- ✅ Email/password authentication with Supabase
- ✅ Form validation (email format, password length, etc.)
- ✅ Error handling with user-friendly messages
- ✅ Loading states during authentication
- ✅ Protected routes (middleware redirects)
- ✅ Automatic profile creation on signup
- ✅ Session management
- ✅ Sign out functionality
- ✅ Responsive design

## How to Test

### 1. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 2. Test Signup Flow

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Fill in the form:
   - **Name:** Your Name
   - **Email:** test@example.com
   - **Password:** password123 (at least 6 characters)
   - **Confirm Password:** password123
3. Click "Create Account"
4. You should be redirected to `/teams` dashboard

**Expected Result:**
- ✅ New user created in Supabase Auth
- ✅ Profile created in `profiles` table
- ✅ Redirected to teams page
- ✅ User info displayed in header

### 3. Test Login Flow

1. Sign out (click the logout icon in header)
2. Go to [http://localhost:3000/login](http://localhost:3000/login)
3. Enter your credentials:
   - **Email:** test@example.com
   - **Password:** password123
4. Click "Log In"
5. You should be redirected to `/teams`

**Expected Result:**
- ✅ Successfully authenticated
- ✅ Redirected to teams page
- ✅ Session persists on page refresh

### 4. Test Protected Routes

1. While logged out, try to visit [http://localhost:3000/teams](http://localhost:3000/teams)
2. You should be automatically redirected to `/login`
3. After logging in, you'll be redirected back to `/teams`

**Expected Result:**
- ✅ Middleware blocks unauthenticated access
- ✅ Redirect to login page
- ✅ Return to original destination after login

### 5. Test Sign Out

1. While logged in, click the logout icon (🚪) in the header
2. You should be redirected to `/login`
3. Try accessing `/teams` - you should be blocked

**Expected Result:**
- ✅ Session cleared
- ✅ Redirected to login
- ✅ Cannot access protected pages

### 6. Test Validation

Try these scenarios to test validation:

**Signup Page:**
- ❌ Empty fields → "Please fill in all fields"
- ❌ Password < 6 chars → "Password must be at least 6 characters"
- ❌ Passwords don't match → "Passwords do not match"
- ❌ Invalid email → Supabase error message
- ❌ Duplicate email → "User already registered"

**Login Page:**
- ❌ Empty fields → "Please fill in all fields"
- ❌ Wrong password → "Invalid login credentials"
- ❌ Non-existent email → "Invalid login credentials"

## Verify in Supabase Dashboard

### Check Authentication Table

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Users**
3. You should see your test user listed

### Check Profiles Table

1. Navigate to **Table Editor** → **profiles**
2. You should see a profile record with:
   - `id` (matches auth user id)
   - `email`
   - `name` (from signup form)
   - `created_at`

### Check Auth Logs

1. Navigate to **Authentication** → **Logs**
2. You should see events like:
   - `user_signedup`
   - `login`
   - `logout`

## Common Issues & Solutions

### Issue: "Invalid API credentials"

**Solution:**
- Check your `.env` file has correct Supabase keys
- Restart dev server: `npm run dev`
- Verify keys at: Supabase Dashboard → Settings → API

### Issue: "User already registered"

**Solution:**
- Use a different email, or
- Delete the test user in Supabase Dashboard → Authentication → Users

### Issue: Redirected to login but can't access signup

**Solution:**
- This shouldn't happen, but if it does:
- Clear browser cookies
- Try incognito/private mode

### Issue: "Profile not created" error

**Solution:**
- Make sure you ran the migration SQL
- Check if `handle_new_user()` trigger exists
- Verify in Supabase Dashboard → Database → Triggers

### Issue: Pages don't load or show errors

**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

## Expected User Flow (Happy Path)

```
1. Landing Page (/)
   ↓
2. Click "Get Started" → Signup Page (/signup)
   ↓
3. Fill form & submit
   ↓
4. Supabase creates auth user
   ↓
5. Trigger creates profile
   ↓
6. Middleware detects session
   ↓
7. Redirect to Teams (/teams)
   ↓
8. User sees dashboard with welcome message
   ↓
9. Can sign out anytime
```

## Testing Checklist

Before moving on, verify these all work:

- [ ] Can create new account
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Protected routes require login
- [ ] Logged in users redirected away from auth pages
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Loading states show during auth
- [ ] User info displays in dashboard
- [ ] Session persists on page refresh
- [ ] Profile created in database

## Files Created

### Core Files
- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/database.types.ts` - TypeScript types
- `middleware.ts` - Route protection & session refresh

### Pages
- `app/(auth)/signup/page.tsx` - Signup page
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/layout.tsx` - Auth layout
- `app/(dashboard)/teams/page.tsx` - Protected teams dashboard
- `app/(dashboard)/layout.tsx` - Dashboard layout

### Hooks & Components
- `hooks/useAuth.ts` - Authentication hook
- `components/auth/SignOutButton.tsx` - Sign out component

## Next Steps

Once authentication is working, you can:

1. **Add Team Creation** - Let users create teams
2. **Add Project Creation** - Let users create projects within teams
3. **Add Team Invitations** - Invite members via email
4. **Add Profile Settings** - Let users update their profile
5. **Add Password Reset** - Forgot password flow

## Need Help?

Check these resources:
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Test Credentials Template

Keep track of your test accounts:

```
Test User 1:
Email: test@example.com
Password: password123
Name: Test User

Test User 2:
Email: test2@example.com
Password: password123
Name: Test User Two
```

---

**✨ Your authentication system is production-ready! Start testing and let me know if you find any issues.**

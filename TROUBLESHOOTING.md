# Troubleshooting Guide

Common issues and their solutions when developing AlignAI.

## Hydration Errors

### Issue: "A tree hydrated but some attributes didn't match"

**Symptoms:**
```
Warning: A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.
```

**Cause:** Browser extensions (like Grammarly, password managers, ad blockers) inject attributes into the HTML after React renders on the server.

**Solution:** ✅ Already fixed!
- Added `suppressHydrationWarning` to `<html>` and `<body>` tags in [app/layout.tsx](app/layout.tsx:18-19)
- This is a harmless warning and won't affect production

**Alternative Solutions:**
1. Disable browser extensions during development
2. Use incognito/private browsing mode
3. The warning doesn't affect functionality - you can ignore it

---

## Development Server Issues

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Issue: Changes not reflecting

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

---

## Build Errors

### Issue: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
# Check types without building
npx tsc --noEmit

# If errors persist, check tsconfig.json is correct
```

---

## Supabase Issues

### Issue: "Failed to fetch" from Supabase

**Checklist:**
- [ ] Is your Supabase project running?
- [ ] Did you run the migration SQL?
- [ ] Are the environment variables correct in `.env.local`?
- [ ] Did you restart the dev server after changing `.env.local`?
- [ ] Is your internet connection working?

**Solution:**
```bash
# Verify environment variables are loaded
cat .env.local

# Check Supabase project status at https://supabase.com/dashboard

# Restart dev server
npm run dev
```

### Issue: "Invalid API key"

**Solution:**
1. Go to Supabase dashboard → Settings → API
2. Copy the **anon/public** key (not the service role key for frontend)
3. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
4. Restart dev server

### Issue: "Row Level Security" blocking queries

**Cause:** RLS policies are too restrictive or not set up correctly.

**Solution:**
1. Check the SQL migration ran successfully
2. Verify RLS policies in Supabase dashboard → Authentication → Policies
3. For debugging, temporarily disable RLS on a table (re-enable for production!)

---

## AI API Issues

### Issue: Anthropic API "Invalid API key"

**Solution:**
1. Verify key at https://console.anthropic.com/settings/keys
2. Make sure key starts with `sk-ant-`
3. Update `ANTHROPIC_API_KEY` in `.env.local`
4. Restart dev server

### Issue: OpenAI API "Rate limit exceeded"

**Cause:** Free tier rate limits or usage quota exceeded.

**Solutions:**
- Wait a few minutes and retry
- Upgrade to paid tier at https://platform.openai.com/account/billing
- Use fewer embedding requests during development

### Issue: AI responses are slow

**Expected:** First request may take 2-5 seconds.

**If consistently slow (>10 seconds):**
- Check your internet connection
- Try using a different AI model (smaller = faster)
- Consider caching responses during development

---

## Styling Issues

### Issue: Tailwind classes not working

**Solution:**
```bash
# Make sure Tailwind is installed
npm install -D tailwindcss @tailwindcss/postcss

# Check app/globals.css has the import
# Should have: @import "tailwindcss";

# Restart dev server
npm run dev
```

### Issue: Dark mode not working

**Cause:** Tailwind v4 uses CSS-based dark mode.

**Solution:**
Add dark mode toggle in your app:
```tsx
// Add to your component
<button onClick={() => document.documentElement.classList.toggle('dark')}>
  Toggle Dark Mode
</button>
```

---

## Database Migration Issues

### Issue: "relation already exists" when running migration

**Cause:** Migration was already run.

**Solution:**
- Skip and continue, or
- Drop all tables and re-run (⚠️ deletes all data):
```sql
-- In Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run the migration
```

### Issue: "pgvector extension not found"

**Solution:**
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

Or enable it in Supabase dashboard → Database → Extensions → enable "vector"

---

## Performance Issues

### Issue: Slow page loads in development

**Normal:** Development mode is slower than production.

**Solutions:**
- Use production build for testing: `npm run build && npm start`
- Optimize images (use Next.js Image component)
- Lazy load components

### Issue: Memory leaks or high CPU usage

**Solution:**
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

---

## Git / Version Control Issues

### Issue: Accidentally committed `.env.local`

**Solution:**
```bash
# Remove from git but keep locally
git rm --cached .env.local

# Make sure .gitignore includes it
echo ".env.local" >> .gitignore

# Commit the fix
git commit -m "Remove .env.local from git"

# Rotate your API keys immediately!
```

---

## Deployment Issues (Vercel)

### Issue: "Environment variables not found" on Vercel

**Solution:**
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add all variables from `.env.local`
3. **Important:** Use `NEXT_PUBLIC_` prefix for client-side variables
4. Redeploy

### Issue: Build fails on Vercel but works locally

**Checklist:**
- [ ] Did you commit all files?
- [ ] Is `package.json` committed?
- [ ] Are all dependencies in `package.json` (not just devDependencies)?
- [ ] Does `npm run build` work locally?

**Solution:**
```bash
# Test production build locally
npm run build
npm start
```

---

## Browser-Specific Issues

### Issue: Works in Chrome but not Safari/Firefox

**Common causes:**
- CSS features not supported (check https://caniuse.com)
- JavaScript features need polyfills
- Different default styles

**Solution:**
- Test early and often in multiple browsers
- Use Next.js built-in polyfills
- Add browser-specific CSS prefixes (Tailwind handles this)

---

## Getting More Help

If you're still stuck:

1. **Check the documentation:**
   - [PRODUCT_VISION.md](./PRODUCT_VISION.md)
   - [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
   - [GETTING_STARTED.md](./GETTING_STARTED.md)

2. **Check the error message carefully:**
   - Next.js has excellent error messages with suggestions
   - Copy the full error and search online

3. **Check official docs:**
   - [Next.js](https://nextjs.org/docs)
   - [Supabase](https://supabase.com/docs)
   - [Anthropic](https://docs.anthropic.com)
   - [Tailwind CSS](https://tailwindcss.com/docs)

4. **Debug step by step:**
   - Use `console.log()` liberally
   - Use browser DevTools (F12)
   - Check Network tab for API errors
   - Check Console for JavaScript errors

5. **Start fresh if needed:**
   ```bash
   # Nuclear option: delete everything and reinstall
   rm -rf node_modules .next package-lock.json
   npm install
   npm run dev
   ```

---

## Quick Diagnostic Checklist

When something breaks, check these in order:

- [ ] Did I save all files?
- [ ] Did I restart the dev server?
- [ ] Are all environment variables set?
- [ ] Is my internet working?
- [ ] Did I run `npm install` after pulling changes?
- [ ] Is the error message telling me exactly what's wrong?
- [ ] Did I read the error message carefully?
- [ ] Have I checked the browser console?
- [ ] Have I checked the terminal output?
- [ ] Did I try turning it off and on again? 😄

---

**Remember:** Most errors are quick fixes. Don't stress - debug systematically and you'll find the solution!

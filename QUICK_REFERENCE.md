# Quick Reference Card

Fast lookup for common tasks and file locations.

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code quality

# Clear cache if things break
rm -rf .next node_modules
npm install
npm run dev
```

## 📁 Important File Locations

### Authentication
- **Signup page**: `app/(auth)/signup/page.tsx`
- **Login page**: `app/(auth)/login/page.tsx`
- **Middleware**: `middleware.ts` (route protection)
- **Auth hook**: `hooks/useAuth.ts`
- **Supabase client**: `lib/supabase/client.ts`
- **Supabase server**: `lib/supabase/server.ts`

### Database
- **Schema (SQL)**: `supabase/migrations/001_initial_schema.sql`
- **Types**: `types/index.ts` and `lib/supabase/database.types.ts`

### AI Integration
- **Prompts**: `lib/ai/prompts.ts`
- **Claude API**: `lib/ai/anthropic.ts`
- **OpenAI Embeddings**: `lib/ai/openai.ts`

### UI/Styling
- **Global CSS**: `app/globals.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Landing page**: `app/page.tsx`
- **Teams dashboard**: `app/(dashboard)/teams/page.tsx`

### Configuration
- **Environment**: `.env` (your keys) and `.env.local.example` (template)
- **Next.js**: `next.config.js`
- **TypeScript**: `tsconfig.json`

## 🔗 Important URLs (Dev)

| Page | URL | Purpose |
|------|-----|---------|
| Landing | http://localhost:3000 | Public homepage |
| Signup | http://localhost:3000/signup | Create account |
| Login | http://localhost:3000/login | Sign in |
| Teams | http://localhost:3000/teams | Dashboard (protected) |

## 🔑 Environment Variables

Required in `.env` file:

```env
# Supabase (get from dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🛠️ Common Code Snippets

### Get current user
```typescript
import { useAuth } from "@/hooks/useAuth";

const { user, loading, signOut } = useAuth();
```

### Supabase query (client-side)
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data, error } = await supabase
  .from('teams')
  .select('*');
```

### Supabase query (server-side)
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase
  .from('teams')
  .select('*');
```

### Protected page component
```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return null; // Middleware will redirect

  return <div>Protected content for {user.email}</div>;
}
```

### Sign out button
```typescript
import { SignOutButton } from "@/components/auth/SignOutButton";

<SignOutButton />
```

## 📊 Database Tables Quick Reference

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profiles | id, email, name, avatar_url |
| `teams` | Team workspaces | id, name |
| `team_members` | Team membership | team_id, user_id, role |
| `projects` | Product projects | id, team_id, name, description |
| `sections` | Product sections | id, project_id, type, title |
| `responses` | User responses | section_id, user_id, content, embedding |
| `consensus` | AI consensus | section_id, merged_content, status |
| `conflicts` | Detected conflicts | section_id, response_ids, ai_analysis |

## 🎨 Color Palette

From `app/globals.css`:

```css
Primary Blue: hsl(221.2 83.2% 53.3%)    /* #3b82f6 */
Purple: hsl(270 70% 60%)                 /* Accent */
Gray-50: hsl(210 40% 98%)                /* Backgrounds */
Gray-900: hsl(222.2 84% 4.9%)            /* Text */
```

## 🔐 Authentication Flow

```
User → Signup → Supabase Auth → Trigger → Profile Created → Redirect to /teams
                     ↓
                  Login → Session → Middleware checks → Access granted
                     ↓
                  Logout → Clear session → Redirect to /login
```

## 🚨 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Build fails | `rm -rf .next && npm run dev` |
| Types error | `npx tsc --noEmit` to check |
| Auth not working | Check `.env` has correct keys, restart server |
| 404 on page | Check file is in correct folder |
| Styles not applying | Check `@import "tailwindcss"` in globals.css |
| DB query fails | Check RLS policies in Supabase |

## 📚 Documentation Quick Links

- [Product Vision](./PRODUCT_VISION.md) - What we're building
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - How it works
- [MVP Plan](./MVP_IMPLEMENTATION_PLAN.md) - Development roadmap
- [Getting Started](./GETTING_STARTED.md) - Setup guide
- [Auth Testing](./AUTH_TESTING_GUIDE.md) - Test authentication
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

## 🎯 Current Status

✅ **Completed:**
- Project foundation & structure
- Database schema designed
- AI integration prepared
- Authentication system (signup/login)
- Protected routes & middleware
- Landing page

🚧 **Next to Build:**
- Team creation & management
- Project creation
- 7 section questionnaire
- AI-powered prompts
- Conflict detection UI
- Consensus building
- PRD export

## 💡 Pro Tips

1. **Use Git early**: Commit often, especially before major changes
2. **Test in Supabase first**: Try queries in SQL Editor before coding
3. **Check the console**: Browser DevTools (F12) shows errors
4. **Read error messages**: They usually tell you exactly what's wrong
5. **Use TypeScript**: It catches bugs before runtime
6. **Mobile test**: Check on mobile early and often
7. **Keep .env safe**: Never commit it to git

---

**Bookmark this page for quick reference during development!**

# Getting Started with AlignAI Development

This guide will walk you through setting up your development environment and getting AlignAI running locally.

## Prerequisites

Before you begin, make sure you have:

- [Node.js 18+](https://nodejs.org/) installed
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) account
- An [Anthropic API](https://www.anthropic.com/) key
- An [OpenAI API](https://openai.com/) key

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if you don't have one)
4. Click "New Project"
5. Fill in the project details:
   - Name: `alignai` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose closest to you
   - Pricing Plan: Free tier is fine for development

### 2.2 Run Database Migrations

1. In your Supabase dashboard, go to the SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press Cmd/Ctrl + Enter

This will create all the necessary tables, indexes, and security policies.

### 2.3 Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings → API
2. You'll need three values:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string)
   - **Service Role Key**: `eyJhbGc...` (different long string) - Keep this secret!

## Step 3: Get API Keys

### 3.1 Anthropic API Key

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-...`)

### 3.2 OpenAI API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create new secret key"
5. Copy the key (starts with `sk-...`)

## Step 4: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Open `.env.local` in your editor and fill in the values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Never commit `.env.local` to version control!

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the AlignAI landing page!

## Step 6: Create Your First Account

1. Click "Get Started" or navigate to `/signup`
2. Create an account with your email and password
3. You'll be automatically logged in

## Step 7: Test the Application

### Create a Team
1. After signing up, you'll be on the dashboard
2. Click "Create Team"
3. Enter a team name (e.g., "My First Team")
4. Click "Create"

### Create a Project
1. Click "Create Project"
2. Enter project details:
   - Name: e.g., "My Startup Idea"
   - Description: Brief overview
3. Click "Create"

### Start Defining Your Product
The app will guide you through 7 sections:
1. Problem Statement
2. Target Users
3. Vision & Solution
4. Key Features
5. Competitors
6. Differentiation
7. Tech Stack

## Development Workflow

### File Structure Quick Reference

```
app/
  ├── (auth)/          # Login, signup pages
  ├── (dashboard)/     # Main app pages (teams, projects)
  └── api/             # API routes

components/
  ├── ui/              # shadcn/ui components
  ├── auth/            # Auth components
  ├── teams/           # Team components
  ├── projects/        # Project components
  └── sections/        # Section components

lib/
  ├── supabase/        # Supabase client
  ├── ai/              # AI integrations
  └── utils/           # Utilities

types/
  └── index.ts         # TypeScript types
```

### Common Development Tasks

#### Add a new component
```bash
# Example: Add a button component
npx shadcn-ui@latest add button
```

#### Run linter
```bash
npm run lint
```

#### Build for production
```bash
npm run build
```

#### Check types
```bash
npx tsc --noEmit
```

## Troubleshooting

### "Failed to fetch" errors
- Make sure your Supabase project is running
- Check that `.env.local` has the correct Supabase URL and keys
- Verify your internet connection

### "API key invalid" errors
- Double-check your Anthropic and OpenAI API keys
- Make sure there are no extra spaces in `.env.local`
- Restart the dev server after changing environment variables

### Database errors
- Ensure you ran the migration script in Supabase SQL editor
- Check the Supabase dashboard logs for more details
- Verify RLS policies are enabled

### Module not found errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall:
  ```bash
  rm -rf node_modules .next
  npm install
  npm run dev
  ```

## Next Steps

Once you have everything running:

1. **Explore the Docs**: Read the other documentation files:
   - [PRODUCT_VISION.md](./PRODUCT_VISION.md)
   - [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
   - [MVP_IMPLEMENTATION_PLAN.md](./MVP_IMPLEMENTATION_PLAN.md)

2. **Start Building**: Follow the MVP Implementation Plan to build out features

3. **Test with a Team**: Invite collaborators to test the alignment features

4. **Iterate**: Gather feedback and improve

## Getting Help

- Check the [GitHub Issues](https://github.com/your-repo/alignai/issues)
- Review the [Next.js docs](https://nextjs.org/docs)
- Read the [Supabase docs](https://supabase.com/docs)
- Consult the [Anthropic docs](https://docs.anthropic.com)

Happy building!

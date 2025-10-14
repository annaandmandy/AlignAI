# AlignAI - MVP Implementation Plan

## MVP Scope Definition

**Goal:** Build a working prototype that demonstrates core value proposition within 4 weeks.

**Must-Have Features:**
1. User authentication (email/password)
2. Create team and invite members
3. Create project within team
4. Navigate through 5 core sections:
   - Problem Statement
   - Target Users
   - Solution/Features
   - Competitors
   - Differentiation
5. AI-guided prompts for each section
6. Team members submit individual responses
7. Basic conflict detection (similarity scoring)
8. AI-generated consensus suggestions
9. View team alignment dashboard
10. Export simple PRD (markdown)

**Nice-to-Have (Defer to Alpha):**
- Real-time collaboration (use polling instead)
- Rich text editor (use textarea)
- Visual charts/diagrams (use simple text summaries)
- Comments system
- Version history
- Multiple projects per team

## Week-by-Week Breakdown

### Week 1: Foundation Setup

**Days 1-2: Project Initialization**
- [ ] Initialize Next.js 14 with TypeScript
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Create project folder structure
- [ ] Set up ESLint and Prettier
- [ ] Initialize Git repository
- [ ] Create basic layout components

**Days 3-4: Supabase Setup**
- [ ] Create Supabase project
- [ ] Design and implement database schema
- [ ] Set up authentication
- [ ] Configure Row Level Security policies
- [ ] Create database migrations
- [ ] Set up Supabase client in Next.js

**Days 5-7: Core Data Models & API**
- [ ] Create TypeScript types/interfaces
- [ ] Build API routes for teams
- [ ] Build API routes for projects
- [ ] Build API routes for sections
- [ ] Build API routes for responses
- [ ] Test CRUD operations

### Week 2: Authentication & Team Management

**Days 8-9: Authentication Flow**
- [ ] Build sign-up page
- [ ] Build login page
- [ ] Implement auth state management
- [ ] Create protected route middleware
- [ ] Build user profile component

**Days 10-11: Team Creation & Management**
- [ ] Create team creation form
- [ ] Build team dashboard
- [ ] Implement team invitation (simple email list)
- [ ] Create team member list view
- [ ] Add role-based permissions

**Days 12-14: Project Setup**
- [ ] Create project creation form
- [ ] Build project dashboard
- [ ] Initialize 5 default sections per project
- [ ] Create section navigation UI
- [ ] Build project settings page

### Week 3: AI Integration & Core Features

**Days 15-16: AI Service Setup**
- [ ] Set up Anthropic API client
- [ ] Set up OpenAI API client (embeddings)
- [ ] Create prompt template system
- [ ] Build AI service abstraction layer
- [ ] Test API integrations

**Days 17-18: Smart Prompts**
- [ ] Design section-specific prompts
- [ ] Build AI prompt generation logic
- [ ] Create response submission form
- [ ] Store responses in database
- [ ] Generate embeddings for responses

**Days 19-21: Conflict Detection & Consensus**
- [ ] Implement cosine similarity calculation
- [ ] Build conflict detection algorithm
- [ ] Create AI conflict analysis service
- [ ] Build consensus generation service
- [ ] Create UI for viewing conflicts
- [ ] Create UI for reviewing AI suggestions

### Week 4: Dashboard, Export & Polish

**Days 22-23: Alignment Dashboard**
- [ ] Calculate team alignment scores
- [ ] Build dashboard showing all responses
- [ ] Display conflicts and consensus status
- [ ] Show section completion progress
- [ ] Create simple visualization (text-based)

**Days 24-25: PRD Export**
- [ ] Build PRD generation service
- [ ] Create markdown template
- [ ] Implement export functionality
- [ ] Add download/copy to clipboard
- [ ] Test with sample data

**Days 26-28: Testing & Polish**
- [ ] End-to-end testing with real scenarios
- [ ] Bug fixes
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Deploy to Vercel
- [ ] Documentation for demo

## Technical Implementation Details

### File Structure
```
alignai/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── teams/
│   │   │   ├── [teamId]/
│   │   │   │   └── projects/
│   │   │   │       └── [projectId]/
│   │   │   │           ├── page.tsx (dashboard)
│   │   │   │           ├── sections/
│   │   │   │           │   └── [sectionId]/
│   │   │   │           └── export/
│   │   │   └── new/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── teams/
│   │   ├── projects/
│   │   ├── sections/
│   │   ├── responses/
│   │   ├── consensus/
│   │   ├── ai/
│   │   │   ├── prompt/
│   │   │   ├── detect-conflicts/
│   │   │   ├── generate-consensus/
│   │   │   └── export-prd/
│   │   └── embeddings/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── auth/
│   ├── teams/
│   ├── projects/
│   ├── sections/
│   ├── responses/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── ai/
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── prompts.ts
│   │   └── embeddings.ts
│   └── utils/
│       ├── similarity.ts
│       ├── validation.ts
│       └── formatting.ts
├── types/
│   ├── database.ts
│   ├── api.ts
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useTeam.ts
│   ├── useProject.ts
│   └── useResponses.ts
└── supabase/
    └── migrations/
```

### Key Algorithms

#### Conflict Detection
```typescript
function detectConflicts(responses: Response[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      const similarity = cosineSimilarity(
        responses[i].embedding,
        responses[j].embedding
      );

      if (similarity < CONFLICT_THRESHOLD) {
        conflicts.push({
          responseIds: [responses[i].id, responses[j].id],
          similarityScore: similarity,
          type: 'semantic_mismatch'
        });
      }
    }
  }

  return conflicts;
}
```

#### Alignment Score
```typescript
function calculateAlignmentScore(responses: Response[]): number {
  if (responses.length < 2) return 1.0;

  const similarities: number[] = [];

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      similarities.push(cosineSimilarity(
        responses[i].embedding,
        responses[j].embedding
      ));
    }
  }

  return similarities.reduce((a, b) => a + b, 0) / similarities.length;
}
```

## Environment Variables Needed

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=
```

## Success Metrics for MVP

1. **Functional Completeness:**
   - [ ] User can create account and team
   - [ ] User can create project
   - [ ] User can complete all 5 sections
   - [ ] AI generates relevant prompts
   - [ ] Conflicts are detected
   - [ ] Consensus suggestions are generated
   - [ ] PRD can be exported

2. **Technical Quality:**
   - [ ] No critical bugs
   - [ ] Page load < 2 seconds
   - [ ] AI responses < 5 seconds
   - [ ] Mobile responsive
   - [ ] Deployed and accessible

3. **User Experience:**
   - [ ] Clear navigation
   - [ ] Intuitive workflow
   - [ ] Helpful AI prompts
   - [ ] Useful conflict detection
   - [ ] Readable PRD export

## Next Steps After MVP

1. **Alpha Phase (Weeks 5-8):**
   - Real-time collaboration with Supabase Realtime
   - Visual alignment dashboard with charts
   - Comments and discussion threads
   - Version history
   - Improved conflict resolution UI

2. **Beta Phase (Weeks 9-12):**
   - Multiple projects per team
   - Custom section templates
   - Notion/Slack integrations
   - Rich text editor
   - PDF export with branding
   - Admin analytics dashboard

3. **Public Launch:**
   - Onboarding flow
   - Landing page and marketing site
   - Pricing and billing (Stripe)
   - Email notifications
   - Mobile app (React Native)

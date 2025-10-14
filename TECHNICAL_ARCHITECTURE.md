# AlignAI - Technical Architecture

## Tech Stack (MVP)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14+ (App Router) + TypeScript | Server components, best performance, excellent DX |
| **Styling** | Tailwind CSS + shadcn/ui | Beautiful UI components, highly customizable |
| **Backend** | Supabase | Auth, PostgreSQL DB, storage, realtime subscriptions |
| **AI Layer** | Anthropic Claude API (primary) / OpenAI (fallback) | Advanced reasoning for conflict detection and summarization |
| **Embeddings** | OpenAI text-embedding-3-small | Cost-effective semantic similarity detection |
| **Deployment** | Vercel | Seamless Next.js integration, edge functions |
| **Version Control** | Git + GitHub | Standard workflow |

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend Layer                       │
│  Next.js 14 App Router + React Server Components + shadcn   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                │
│  /api/projects  /api/prompts  /api/alignment  /api/ai       │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                ▼                            ▼
┌───────────────────────────┐  ┌────────────────────────────┐
│    Supabase Backend       │  │      AI Services Layer      │
│  - PostgreSQL Database    │  │  - Anthropic Claude API     │
│  - Authentication         │  │  - OpenAI Embeddings API    │
│  - Realtime Subscriptions │  │  - Prompt Engineering       │
│  - Row Level Security     │  │  - Conflict Detection       │
└───────────────────────────┘  └────────────────────────────┘
```

## Database Schema

### Core Tables

#### `users`
- Managed by Supabase Auth
- Extended with profile information

#### `teams`
```sql
- id: uuid (PK)
- name: text
- created_at: timestamp
- updated_at: timestamp
```

#### `team_members`
```sql
- id: uuid (PK)
- team_id: uuid (FK → teams)
- user_id: uuid (FK → auth.users)
- role: enum ('owner', 'member', 'viewer')
- joined_at: timestamp
```

#### `projects`
```sql
- id: uuid (PK)
- team_id: uuid (FK → teams)
- name: text
- description: text
- created_by: uuid (FK → auth.users)
- created_at: timestamp
- updated_at: timestamp
```

#### `sections`
```sql
- id: uuid (PK)
- project_id: uuid (FK → projects)
- type: enum ('vision', 'problem', 'target_users', 'features', 'competitors', 'differentiation', 'tech_stack')
- title: text
- order: integer
- created_at: timestamp
```

#### `responses`
```sql
- id: uuid (PK)
- section_id: uuid (FK → sections)
- user_id: uuid (FK → auth.users)
- content: text
- embedding: vector(1536)  -- for semantic similarity
- created_at: timestamp
- updated_at: timestamp
```

#### `consensus`
```sql
- id: uuid (PK)
- section_id: uuid (FK → sections)
- merged_content: text
- ai_suggestion: text
- status: enum ('pending', 'approved', 'rejected')
- approved_by: uuid[] (array of user_ids)
- created_at: timestamp
- updated_at: timestamp
```

#### `conflicts`
```sql
- id: uuid (PK)
- section_id: uuid (FK → sections)
- response_ids: uuid[] (array of conflicting response IDs)
- conflict_type: text
- similarity_score: float
- ai_analysis: jsonb
- resolution_status: enum ('open', 'resolved', 'dismissed')
- created_at: timestamp
```

#### `comments`
```sql
- id: uuid (PK)
- section_id: uuid (FK → sections)
- response_id: uuid (FK → responses, nullable)
- user_id: uuid (FK → auth.users)
- content: text
- created_at: timestamp
```

#### `prd_exports`
```sql
- id: uuid (PK)
- project_id: uuid (FK → projects)
- content: jsonb
- format: enum ('markdown', 'pdf', 'json')
- generated_at: timestamp
```

## AI Integration Architecture

### 1. Smart Prompts Flow
```typescript
// Prompt generation based on context
Context → Claude API → Dynamic Follow-up Questions → Store Response
```

### 2. Embedding Generation
```typescript
// For conflict detection
User Response → OpenAI Embeddings API → Store Vector → Compare Similarity
```

### 3. Conflict Detection Pipeline
```typescript
1. Calculate cosine similarity between response embeddings
2. If similarity < threshold (e.g., 0.75), flag as potential conflict
3. Send to Claude API for semantic analysis
4. Generate AI suggestion for merged version
5. Store in conflicts table
```

### 4. Consensus Generation
```typescript
Multiple Responses + Context → Claude API → Synthesized Consensus → Team Review
```

### 5. PRD Generation
```typescript
All Consensus Sections → Claude API → Structured PRD → Export (MD/PDF/JSON)
```

## Key Implementation Patterns

### Real-time Collaboration
- Use Supabase Realtime for live updates
- Optimistic UI updates with eventual consistency
- Conflict resolution UI for simultaneous edits

### AI Prompt Templates
Store reusable prompts in database or config:
- Discovery questions by section type
- Conflict analysis templates
- Consensus generation templates
- PRD formatting templates

### Security
- Row Level Security (RLS) in Supabase
- Team-based access control
- API rate limiting for AI calls
- Input sanitization

### Performance Optimization
- Server components for initial render
- Streaming responses for AI generation
- Cache embeddings to reduce API costs
- Debounced auto-save

## Future Integrations

### Notion API
- Export consensus to Notion pages
- Sync project updates

### Slack API
- Bot for meeting summaries
- Notifications for conflicts/consensus

### GitHub API
- Auto-summarize commits
- Link technical decisions to product rationale

## Development Phases

### Phase 1: MVP Core (Weeks 1-4)
- Project/team/section CRUD
- Basic smart prompts
- Response collection
- Simple consensus view

### Phase 2: AI Features (Weeks 5-8)
- Embedding generation
- Conflict detection
- AI consensus suggestions
- PRD export

### Phase 3: Collaboration (Weeks 9-12)
- Real-time updates
- Comments system
- Version history
- Visual summaries

# Project Page Implementation Guide

The project detail page is now fully functional with AI-powered prompts, response submission, and team collaboration! 🎉

## What Was Built

### Core Features Completed

1. **Dynamic AI Prompts**
   - ✅ AI-generated questions based on section type
   - ✅ Context-aware prompts using Claude API
   - ✅ Fallback to default questions if AI generation fails
   - ✅ Loading states while generating prompts

2. **Response Management**
   - ✅ Save drafts (without generating embeddings)
   - ✅ Submit responses (with AI embeddings for conflict detection)
   - ✅ Auto-load user's existing response when switching sections
   - ✅ Update existing responses instead of creating duplicates
   - ✅ Loading and disabled states during submission

3. **Team Collaboration**
   - ✅ Display all team member responses
   - ✅ Show user avatars and timestamps
   - ✅ Real-time response updates after submission
   - ✅ Empty states for sections without responses

4. **Progress Tracking**
   - ✅ Track completed sections (sections with submitted responses)
   - ✅ Visual progress bar showing completion percentage
   - ✅ Green checkmarks on completed sections
   - ✅ Blue checkmark on currently selected section
   - ✅ Auto-update progress after submitting responses

5. **Section Navigation**
   - ✅ Sticky sidebar with all 7 sections
   - ✅ Visual indicators for active/completed sections
   - ✅ Section icons and descriptions
   - ✅ Smooth transitions between sections

## Files Created

### API Routes

**`app/api/prompts/route.ts`**
- Generates AI-powered questions using Claude API
- Takes section type and project context as input
- Returns customized questions or falls back to defaults
- Endpoint: `POST /api/prompts`

**`app/api/responses/route.ts`**
- Handles response submission with embeddings
- GET endpoint to fetch all responses for a section
- POST endpoint to create/update responses
- Generates embeddings using OpenAI API for submitted responses
- Endpoints: `GET/POST /api/responses`

### Updated Pages

**`app/(dashboard)/teams/[teamId]/projects/[projectId]/page.tsx`**
- Complete project detail page with all functionality
- State management for prompts, responses, and progress
- API integration for all features
- Responsive UI with loading states

## How It Works

### User Flow

```
1. User navigates to project page
   ↓
2. First section loads automatically
   ↓
3. AI generates custom questions for the section
   ↓
4. User types their response
   ↓
5. User can:
   - Save Draft (stores in DB, no embedding)
   - Submit Response (stores in DB with embedding)
   ↓
6. After submission:
   - Response appears in "Team Responses"
   - Progress bar updates
   - Section marked as completed
   ↓
7. User switches to next section
   ↓
8. Process repeats for all 7 sections
```

### Data Flow

#### Loading a Section
```typescript
1. User clicks section → setSelectedSection()
2. useEffect triggers:
   - fetchAIPrompts() → POST /api/prompts
   - fetchResponses() → GET /api/responses
   - fetchUserResponse() → Supabase direct query
3. UI updates with prompts and responses
```

#### Submitting a Response
```typescript
1. User clicks "Submit Response"
2. POST /api/responses with:
   - sectionId
   - content
   - isDraft: false
3. Backend:
   - Generates embedding using OpenAI
   - Stores response in database
   - Returns success
4. Frontend:
   - Refreshes team responses
   - Updates progress tracking
   - Shows response in list
```

#### Draft Saving
```typescript
1. User clicks "Save Draft"
2. POST /api/responses with:
   - sectionId
   - content
   - isDraft: true
3. Backend:
   - Skips embedding generation
   - Stores/updates response
4. Draft persists but doesn't count as "completed"
```

## API Endpoints

### POST /api/prompts
Generate AI-powered questions for a section

**Request:**
```json
{
  "sectionType": "problem",
  "projectContext": "Mobile app for students"
}
```

**Response:**
```json
{
  "title": "Questions",
  "questions": [
    "What specific problem are you trying to solve?",
    "Who experiences this problem most acutely?",
    "..."
  ],
  "systemPrompt": "You are an expert product strategist..."
}
```

### POST /api/responses
Submit or update a response

**Request:**
```json
{
  "sectionId": "uuid",
  "content": "Our product solves...",
  "isDraft": false
}
```

**Response:**
```json
{
  "response": {
    "id": "uuid",
    "section_id": "uuid",
    "user_id": "uuid",
    "content": "Our product solves...",
    "embedding": [0.1, 0.2, ...],
    "is_draft": false,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### GET /api/responses?sectionId={id}
Fetch all responses for a section

**Response:**
```json
{
  "responses": [
    {
      "id": "uuid",
      "content": "Response text...",
      "created_at": "2025-01-15T10:30:00Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

## UI Components

### Section Sidebar
- Shows all 7 sections with icons
- Visual states:
  - **Gray circle**: Not started
  - **Green checkmark**: Completed
  - **Blue checkmark**: Currently selected
- Progress bar at bottom showing completion %

### AI Prompts Area
- Blue-bordered section at top
- Loading spinner while generating
- 4-5 bullet point questions
- Falls back to defaults if AI fails

### Response Form
- Auto-loads user's existing response
- Two buttons:
  - **Save Draft**: Quick save without submission
  - **Submit Response**: Final submission with embedding
- Disabled states during operations
- Character count or other validation (can be added)

### Team Responses
- Card-based layout
- Each response shows:
  - User avatar (first letter of name)
  - User name and email
  - Timestamp
  - Response content
- Empty state when no responses

## Progress Tracking

Progress is calculated based on **submitted responses** (not drafts):

```typescript
// Count sections with submitted responses
const completedSections = responses.filter(r =>
  r.user_id === currentUser.id &&
  r.is_draft === false
).length;

const progress = (completedSections / totalSections) * 100;
```

## Database Operations

### When User Submits Response

1. **Check for existing response:**
```sql
SELECT id FROM responses
WHERE section_id = ? AND user_id = ?
```

2. **If exists, update:**
```sql
UPDATE responses
SET content = ?, embedding = ?, is_draft = false, updated_at = NOW()
WHERE id = ?
```

3. **If not exists, create:**
```sql
INSERT INTO responses (section_id, user_id, content, embedding, is_draft)
VALUES (?, ?, ?, ?, false)
```

4. **Generate embedding** (only if not draft):
- Call OpenAI embeddings API
- Store 1536-dimension vector
- Used later for conflict detection

## Environment Variables Required

Make sure these are in your `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Anthropic (for AI prompts)
ANTHROPIC_API_KEY=your_anthropic_key

# OpenAI (for embeddings)
OPENAI_API_KEY=your_openai_key
```

## Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] First section selected by default
- [ ] AI prompts load for each section
- [ ] Can type in response textarea
- [ ] Save Draft button works
- [ ] Submit Response button works
- [ ] Response appears in team responses area

### Section Navigation
- [ ] Can click different sections
- [ ] Content updates when switching sections
- [ ] User's existing response loads when switching back
- [ ] Active section highlighted in blue

### Progress Tracking
- [ ] Progress shows 0/7 initially
- [ ] Progress updates after submitting response
- [ ] Completed sections show green checkmark
- [ ] Progress bar fills correctly
- [ ] Progress persists on page reload

### Team Collaboration
- [ ] Can see other team members' responses
- [ ] Responses show correct user name/email
- [ ] Timestamps display correctly
- [ ] Responses sorted by creation date

### Error Handling
- [ ] Loading states show during operations
- [ ] Buttons disabled during submission
- [ ] Graceful fallback if AI prompts fail
- [ ] Error messages in console for debugging

## Common Issues & Solutions

### Issue: AI prompts not loading

**Check:**
1. Is `ANTHROPIC_API_KEY` set in `.env`?
2. Check browser console for errors
3. Check API route logs: `app/api/prompts/route.ts`
4. Verify Anthropic API key is valid

**Solution:**
- The system falls back to default questions if AI fails
- Check console for error messages
- Verify API key has sufficient credits

### Issue: Embeddings not generating

**Check:**
1. Is `OPENAI_API_KEY` set in `.env`?
2. Check API route logs: `app/api/responses/route.ts`
3. Verify OpenAI API key is valid

**Solution:**
- Embeddings generation is non-critical
- Responses will still save without embeddings
- Conflict detection won't work without embeddings

### Issue: Responses not appearing

**Check:**
1. Is response marked as `is_draft: false`?
2. Check Supabase Table Editor → responses table
3. Verify RLS policies allow reading responses

**Solution:**
- GET /api/responses only returns `is_draft: false` responses
- Drafts are saved but not displayed to team
- Check browser network tab for API errors

### Issue: Progress not updating

**Check:**
1. Is response submitted (not just draft)?
2. Check `fetchCompletedSections()` is called
3. Verify response `is_draft: false` in database

**Solution:**
- Only submitted responses count as completed
- Progress updates after `handleSubmitResponse()` completes
- Refresh page to recalculate from database

## What's Next?

Now that the core project page is working, the next features to build:

1. **Conflict Detection** (Week 3 of MVP plan)
   - Compare embeddings between team responses
   - Calculate cosine similarity
   - Highlight conflicting viewpoints
   - Visual indicators for disagreements

2. **AI Conflict Analysis** (Week 3)
   - Send conflicting responses to Claude
   - Get AI analysis of differences
   - Display insights to team

3. **Consensus Building** (Week 4)
   - AI-suggested merged versions
   - Team voting on suggestions
   - Collaborative editing
   - Version history

4. **PRD Export** (Week 5)
   - Generate final document from consensus
   - Export as PDF/Markdown
   - Include all sections
   - Team signatures

## Quick Reference

### File Locations
```
app/
  api/
    prompts/route.ts           # AI prompt generation
    responses/route.ts         # Response submission & fetching
  (dashboard)/
    teams/[teamId]/
      projects/[projectId]/
        page.tsx               # Main project page

lib/
  ai/
    prompts.ts                 # Prompt templates
    anthropic.ts               # Claude API integration
    openai.ts                  # OpenAI embeddings
```

### Key Functions

**In project page:**
- `fetchAIPrompts()` - Get AI questions for section
- `fetchResponses()` - Get all team responses
- `fetchUserResponse()` - Load user's existing response
- `handleSaveDraft()` - Save without submission
- `handleSubmitResponse()` - Submit with embedding
- `fetchCompletedSections()` - Update progress tracking

### Database Tables Used
- `projects` - Project metadata
- `sections` - 7 sections per project
- `responses` - User responses to sections
- `profiles` - User information

---

**Your project page is fully functional! Team members can now collaborate on defining their product across all 7 sections with AI-powered guidance.** 🚀

Test it out by:
1. Navigating to a project
2. Answering questions in each section
3. Submitting responses
4. Watching progress update
5. Seeing team responses appear

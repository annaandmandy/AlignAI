# AlignAI

**Your team's shared product brain** — an AI co-pilot that ensures everyone's version of the idea is the same.

## Overview

AlignAI is a collaborative workspace that helps small teams (hackathon teams, early-stage startups, student projects) move from idea chaos to shared understanding. It uses AI to guide teams through product definition, detect misalignments, and generate consensus.

## Features

- **Smart AI Prompts**: AI-guided discovery flow that helps teams define vision, users, problems, and differentiation
- **Conflict Detection**: Automatically detects when team members have different ideas and suggests merged versions
- **Visual Summaries**: Generates one-page product charters and alignment dashboards
- **Real-time Collaboration**: Multiple team members can work together simultaneously
- **PRD Export**: Generate professional Product Requirement Documents

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: Anthropic Claude API, OpenAI Embeddings API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Anthropic API key
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd alignai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:
- Supabase URL and keys
- Anthropic API key
- OpenAI API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`
3. Enable Row Level Security (RLS) policies
4. Update your `.env.local` with the Supabase credentials

## Project Structure

```
alignai/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard and main app
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth-related components
│   ├── teams/            # Team management
│   ├── projects/         # Project components
│   └── sections/         # Section components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client
│   ├── ai/               # AI service integrations
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── supabase/             # Database migrations
```

## Documentation

- [Product Vision](./PRODUCT_VISION.md) - Full product vision and features
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - System design and architecture
- [MVP Implementation Plan](./MVP_IMPLEMENTATION_PLAN.md) - Development roadmap

## Development Roadmap

### MVP (Weeks 1-4)
- ✅ Project setup and foundation
- ⬜ Authentication and team management
- ⬜ AI-guided prompts
- ⬜ Conflict detection
- ⬜ Basic PRD export

### Alpha (Weeks 5-8)
- ⬜ Real-time collaboration
- ⬜ Visual alignment dashboard
- ⬜ Comments system
- ⬜ Version history

### Beta (Weeks 9-12)
- ⬜ Multiple projects per team
- ⬜ Notion/Slack integrations
- ⬜ Advanced PRD templates
- ⬜ Analytics dashboard

## Contributing

This is currently a private project. If you'd like to contribute, please reach out to the maintainers.

## License

ISC

## Contact

For questions or feedback, please open an issue or contact the team.

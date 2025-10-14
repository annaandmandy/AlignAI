-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'member', 'viewer');
CREATE TYPE section_type AS ENUM ('vision', 'problem', 'target_users', 'features', 'competitors', 'differentiation', 'tech_stack');
CREATE TYPE consensus_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE conflict_resolution_status AS ENUM ('open', 'resolved', 'dismissed');
CREATE TYPE export_format AS ENUM ('markdown', 'pdf', 'json');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections table
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type section_type NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, type)
);

-- Responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, user_id)
);

-- Consensus table
CREATE TABLE public.consensus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL UNIQUE,
  merged_content TEXT NOT NULL,
  ai_suggestion TEXT NOT NULL,
  status consensus_status DEFAULT 'pending' NOT NULL,
  approved_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conflicts table
CREATE TABLE public.conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  response_ids UUID[] NOT NULL,
  conflict_type TEXT NOT NULL,
  similarity_score FLOAT NOT NULL,
  ai_analysis JSONB NOT NULL,
  resolution_status conflict_resolution_status DEFAULT 'open' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
  response_id UUID REFERENCES public.responses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRD exports table
CREATE TABLE public.prd_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  format export_format NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_projects_team_id ON public.projects(team_id);
CREATE INDEX idx_sections_project_id ON public.sections(project_id);
CREATE INDEX idx_responses_section_id ON public.responses(section_id);
CREATE INDEX idx_responses_user_id ON public.responses(user_id);
CREATE INDEX idx_consensus_section_id ON public.consensus(section_id);
CREATE INDEX idx_conflicts_section_id ON public.conflicts(section_id);
CREATE INDEX idx_comments_section_id ON public.comments(section_id);
CREATE INDEX idx_prd_exports_project_id ON public.prd_exports(project_id);

-- Create vector similarity search index
CREATE INDEX idx_responses_embedding ON public.responses USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consensus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prd_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Teams: Users can only see teams they're members of
CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
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
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'
    )
  );

-- Team Members: Users can view team members of their teams
CREATE POLICY "Team members can view other team members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can add members"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_members.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'owner'
    )
  );

CREATE POLICY "Team owners can remove members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'owner'
    )
  );

-- Projects: Team members can view and create projects
CREATE POLICY "Team members can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = projects.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = projects.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'member')
    )
  );

CREATE POLICY "Team members can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = projects.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner', 'member')
    )
  );

-- Sections: Team members can view and edit sections
CREATE POLICY "Team members can view sections"
  ON public.sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE p.id = sections.project_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create sections"
  ON public.sections FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE p.id = sections.project_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'member')
    )
  );

-- Responses: Team members can view all responses, users can edit their own
CREATE POLICY "Team members can view responses"
  ON public.responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON p.id = s.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE s.id = responses.section_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create responses"
  ON public.responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON p.id = s.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE s.id = responses.section_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'member')
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own responses"
  ON public.responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Consensus, Conflicts, Comments, PRD Exports: Similar patterns
CREATE POLICY "Team members can view consensus"
  ON public.consensus FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON p.id = s.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE s.id = consensus.section_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create consensus"
  ON public.consensus FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON p.id = s.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE s.id = consensus.section_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'member')
    )
  );

CREATE POLICY "Team members can update consensus"
  ON public.consensus FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sections s
      JOIN public.projects p ON p.id = s.project_id
      JOIN public.team_members tm ON tm.team_id = p.team_id
      WHERE s.id = consensus.section_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'member')
    )
  );

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consensus_updated_at BEFORE UPDATE ON public.consensus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to initialize default sections when a project is created
CREATE OR REPLACE FUNCTION public.initialize_project_sections()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sections (project_id, type, title, "order") VALUES
    (NEW.id, 'problem', 'Problem Statement', 1),
    (NEW.id, 'target_users', 'Target Users', 2),
    (NEW.id, 'vision', 'Vision & Solution', 3),
    (NEW.id, 'features', 'Key Features', 4),
    (NEW.id, 'competitors', 'Competitors', 5),
    (NEW.id, 'differentiation', 'Differentiation', 6),
    (NEW.id, 'tech_stack', 'Tech Stack', 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create sections
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.initialize_project_sections();

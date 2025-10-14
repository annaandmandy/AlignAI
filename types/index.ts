/**
 * Core type definitions for AlignAI
 */

export type UserRole = "owner" | "member" | "viewer";

export type SectionType =
  | "vision"
  | "problem"
  | "target_users"
  | "features"
  | "competitors"
  | "differentiation"
  | "tech_stack";

export type ConflictResolutionStatus = "open" | "resolved" | "dismissed";

export type ConsensusStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
  user?: User;
}

export interface Project {
  id: string;
  team_id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  team?: Team;
  creator?: User;
}

export interface Section {
  id: string;
  project_id: string;
  type: SectionType;
  title: string;
  order: number;
  created_at: string;
  responses?: Response[];
  consensus?: Consensus;
}

export interface Response {
  id: string;
  section_id: string;
  user_id: string;
  content: string;
  embedding?: number[];
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Consensus {
  id: string;
  section_id: string;
  merged_content: string;
  ai_suggestion: string;
  status: ConsensusStatus;
  approved_by: string[];
  created_at: string;
  updated_at: string;
}

export interface Conflict {
  id: string;
  section_id: string;
  response_ids: string[];
  conflict_type: string;
  similarity_score: number;
  ai_analysis: {
    differences: string[];
    suggested_merge: string;
    reasoning: string;
  };
  resolution_status: ConflictResolutionStatus;
  created_at: string;
  responses?: Response[];
}

export interface Comment {
  id: string;
  section_id: string;
  response_id?: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface PRDExport {
  id: string;
  project_id: string;
  content: {
    problem: string;
    solution: string;
    target_users: string;
    features: string[];
    competitors: string;
    differentiation: string;
    tech_stack: string;
  };
  format: "markdown" | "pdf" | "json";
  generated_at: string;
}

export interface AlignmentScore {
  section_id: string;
  section_type: SectionType;
  score: number; // 0-1, where 1 is perfect alignment
  response_count: number;
  has_consensus: boolean;
  has_conflicts: boolean;
}

export interface TeamAlignmentDashboard {
  project_id: string;
  overall_score: number;
  section_scores: AlignmentScore[];
  total_responses: number;
  pending_conflicts: number;
  approved_consensus_count: number;
  last_updated: string;
}

// AI Service Types

export interface AIPromptRequest {
  section_type: SectionType;
  context?: {
    project_name?: string;
    previous_responses?: string[];
    team_size?: number;
  };
}

export interface AIPromptResponse {
  questions: string[];
  follow_up?: string;
}

export interface ConflictDetectionRequest {
  responses: Response[];
  threshold?: number; // Default 0.75
}

export interface ConflictDetectionResponse {
  conflicts: Conflict[];
  overall_alignment: number;
}

export interface ConsensusGenerationRequest {
  section_id: string;
  responses: Response[];
}

export interface ConsensusGenerationResponse {
  merged_content: string;
  reasoning: string;
  confidence: number;
}

export interface PRDGenerationRequest {
  project_id: string;
  sections: Section[];
  consensus_data: Consensus[];
}

export interface PRDGenerationResponse {
  markdown: string;
  structured_data: PRDExport["content"];
}

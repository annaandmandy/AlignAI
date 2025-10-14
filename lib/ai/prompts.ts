/**
 * AI Prompt Templates for AlignAI
 */

import { SectionType } from "@/types";

export interface PromptTemplate {
  systemPrompt: string;
  questions: string[];
  followUpPrompt: string;
}

/**
 * System prompts for different AI tasks
 */
export const SYSTEM_PROMPTS = {
  DISCOVERY_GUIDE: `You are an expert product mentor helping teams define their product vision.
Your role is to ask insightful questions that help teams think deeply about their users, problems, and solutions.
Be concise, friendly, and constructive. Help teams avoid common pitfalls like building solutions without understanding the problem.`,

  CONFLICT_ANALYZER: `You are an expert at identifying misalignments in team thinking.
Analyze multiple team members' responses and identify semantic differences, even when wording is similar.
Be objective and constructive. Highlight both differences and areas of agreement.`,

  CONSENSUS_BUILDER: `You are a skilled facilitator helping teams reach consensus.
Given multiple perspectives, synthesize them into a clear, unified statement that captures the best of each viewpoint.
Preserve important nuances while removing contradictions.`,

  PRD_WRITER: `You are an experienced product manager creating Product Requirement Documents.
Transform team consensus into clear, actionable PRDs that developers and stakeholders can understand.
Be specific, structured, and professional.`,
};

/**
 * Discovery questions for each section type
 */
export const SECTION_PROMPTS: Record<SectionType, PromptTemplate> = {
  problem: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "What specific problem are you trying to solve?",
      "Who experiences this problem most acutely?",
      "How do people currently deal with this problem?",
      "What makes this problem worth solving now?",
      "What happens if this problem isn't solved?",
    ],
    followUpPrompt: `Based on the problem described, what follow-up questions would help the team
clarify and validate their problem statement? Provide 2-3 specific questions.`,
  },

  target_users: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "Who exactly will use your product? Be specific about demographics, roles, or characteristics.",
      "What are the key pain points or needs of these users?",
      "How do these users currently spend their time related to this problem?",
      "What motivates these users to seek a solution?",
      "Are there different user segments with different needs?",
    ],
    followUpPrompt: `Based on the target users described, what additional questions would help
the team develop clearer user personas? Provide 2-3 specific questions.`,
  },

  vision: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "What is your product vision in one sentence?",
      "How will your product solve the problem you identified?",
      "What does success look like for your users?",
      "What's the core value proposition?",
      "How will users' lives be different after using your product?",
    ],
    followUpPrompt: `Based on the vision described, what questions would help the team
articulate a clearer, more compelling product vision? Provide 2-3 specific questions.`,
  },

  features: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "What are the essential features needed to solve the core problem? (List 3-5)",
      "Which single feature would provide the most value to users?",
      "What features are nice-to-have but not critical for MVP?",
      "Are there features that differentiate you from alternatives?",
      "What's the minimum set of features needed to test your hypothesis?",
    ],
    followUpPrompt: `Based on the features described, what questions would help the team
prioritize features and identify the true MVP? Provide 2-3 specific questions.`,
  },

  competitors: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "Who are your main competitors or alternatives?",
      "How do users currently solve this problem without your product?",
      "What do existing solutions do well?",
      "What are the gaps or weaknesses in current solutions?",
      "Why would someone choose your product over alternatives?",
    ],
    followUpPrompt: `Based on the competitive landscape described, what questions would help
the team better understand their competitive position? Provide 2-3 specific questions.`,
  },

  differentiation: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "What makes your product unique?",
      "What can you do that competitors can't or won't do?",
      "What's your unfair advantage?",
      "Why would users switch from their current solution to yours?",
      "What would users lose if your product didn't exist?",
    ],
    followUpPrompt: `Based on the differentiation described, what questions would help the team
sharpen their unique value proposition? Provide 2-3 specific questions.`,
  },

  tech_stack: {
    systemPrompt: SYSTEM_PROMPTS.DISCOVERY_GUIDE,
    questions: [
      "What technologies or platforms are you considering?",
      "What are the key technical requirements or constraints?",
      "What's your team's technical expertise?",
      "Do you need to integrate with existing systems?",
      "What are your performance, scale, or security requirements?",
    ],
    followUpPrompt: `Based on the technical approach described, what questions would help the team
make better technology decisions? Provide 2-3 specific questions.`,
  },
};

/**
 * Generate dynamic follow-up questions based on user responses
 */
export function generateFollowUpPrompt(
  sectionType: SectionType,
  userResponse: string
): string {
  const template = SECTION_PROMPTS[sectionType];
  return `${template.followUpPrompt}

User's response:
"${userResponse}"

Provide 2-3 specific, actionable follow-up questions that would help deepen their thinking.
Format as a JSON array of strings.`;
}

/**
 * Conflict detection prompt
 */
export function generateConflictAnalysisPrompt(
  sectionType: SectionType,
  responses: Array<{ user: string; content: string }>
): string {
  const responsesText = responses
    .map((r, i) => `Response ${i + 1} (${r.user}):\n"${r.content}"`)
    .join("\n\n");

  return `Analyze these team members' responses for the "${sectionType}" section and identify any conflicts or misalignments.

${responsesText}

Provide your analysis in the following JSON format:
{
  "has_conflict": true/false,
  "conflict_severity": "low" | "medium" | "high",
  "differences": ["list of specific differences"],
  "areas_of_agreement": ["list of areas where team agrees"],
  "suggested_merge": "A synthesized version that reconciles differences",
  "reasoning": "Explanation of the conflicts and how the merge addresses them"
}`;
}

/**
 * Consensus generation prompt
 */
export function generateConsensusPrompt(
  sectionType: SectionType,
  responses: Array<{ user: string; content: string }>
): string {
  const responsesText = responses
    .map((r, i) => `${r.user}:\n"${r.content}"`)
    .join("\n\n");

  return `Create a consensus statement for the "${sectionType}" section based on these team members' inputs.

${responsesText}

Your goal is to synthesize these perspectives into a single, clear statement that:
1. Captures the core ideas from all responses
2. Resolves any contradictions by finding common ground
3. Preserves important nuances and specific details
4. Is concise and actionable

Provide your response in this JSON format:
{
  "merged_content": "The consensus statement",
  "reasoning": "Explanation of how you synthesized the responses",
  "confidence": 0.0-1.0 (how confident you are in this consensus)
}`;
}

/**
 * PRD generation prompt
 */
export function generatePRDPrompt(sections: Record<SectionType, string>): string {
  return `Generate a professional Product Requirement Document based on this team's consensus.

PROBLEM:
${sections.problem || "Not specified"}

TARGET USERS:
${sections.target_users || "Not specified"}

VISION & SOLUTION:
${sections.vision || "Not specified"}

KEY FEATURES:
${sections.features || "Not specified"}

COMPETITORS:
${sections.competitors || "Not specified"}

DIFFERENTIATION:
${sections.differentiation || "Not specified"}

TECH STACK:
${sections.tech_stack || "Not specified"}

Create a comprehensive PRD in markdown format with the following sections:
1. Executive Summary
2. Problem Statement
3. Target Users
4. Product Vision
5. Key Features
6. Competitive Analysis
7. Unique Value Proposition
8. Technical Approach
9. Success Metrics (suggest relevant metrics)
10. Risks and Mitigations (identify potential risks)

Make it professional, specific, and actionable for a development team.`;
}

/**
 * Get initial questions for a section
 */
export function getInitialQuestions(sectionType: SectionType): string[] {
  return SECTION_PROMPTS[sectionType].questions;
}

/**
 * Get system prompt for a section
 */
export function getSystemPrompt(sectionType: SectionType): string {
  return SECTION_PROMPTS[sectionType].systemPrompt;
}

/**
 * Anthropic Claude API integration for AlignAI
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Generate a completion using Claude
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ClaudeResponse> {
  const response = await anthropic.messages.create({
    model: options?.model || "claude-3-5-sonnet-20241022",
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 0.7,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  return {
    content: textContent.text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

/**
 * Generate follow-up questions based on user response
 */
export async function generateFollowUpQuestions(
  systemPrompt: string,
  followUpPrompt: string
): Promise<string[]> {
  const response = await generateCompletion(systemPrompt, followUpPrompt, {
    temperature: 0.8,
  });

  try {
    // Extract JSON from the response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse follow-up questions:", error);
    // Fallback: split by newlines and filter
    return response.content
      .split("\n")
      .filter((line) => line.trim().match(/^[\d\-\*]|^\?/))
      .map((line) => line.replace(/^[\d\-\*\.\)]\s*/, "").trim())
      .filter((q) => q.length > 10)
      .slice(0, 3);
  }
}

/**
 * Analyze conflicts between team responses
 */
export async function analyzeConflicts(
  prompt: string
): Promise<{
  has_conflict: boolean;
  conflict_severity: "low" | "medium" | "high";
  differences: string[];
  areas_of_agreement: string[];
  suggested_merge: string;
  reasoning: string;
}> {
  const response = await generateCompletion(
    "You are an expert at analyzing team alignment and identifying conflicts.",
    prompt,
    { temperature: 0.3 }
  );

  try {
    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse conflict analysis:", error);
    throw new Error("Failed to analyze conflicts");
  }
}

/**
 * Generate consensus from multiple responses
 */
export async function generateConsensus(
  prompt: string
): Promise<{
  merged_content: string;
  reasoning: string;
  confidence: number;
}> {
  const response = await generateCompletion(
    "You are a skilled facilitator helping teams reach consensus.",
    prompt,
    { temperature: 0.5 }
  );

  try {
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse consensus:", error);
    throw new Error("Failed to generate consensus");
  }
}

/**
 * Generate PRD from section consensus
 */
export async function generatePRD(prompt: string): Promise<string> {
  const response = await generateCompletion(
    "You are an experienced product manager creating Product Requirement Documents.",
    prompt,
    {
      maxTokens: 8192,
      temperature: 0.6,
    }
  );

  return response.content;
}

/**
 * Stream a completion (for real-time responses)
 */
export async function* streamCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: options?.model || "claude-3-5-sonnet-20241022",
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 0.7,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      yield chunk.delta.text;
    }
  }
}

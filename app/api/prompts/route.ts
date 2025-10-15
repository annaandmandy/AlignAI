import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { generateCompletion } from "@/lib/ai/anthropic";
import { SECTION_PROMPTS } from "@/lib/ai/prompts";
import type { SectionType } from "@/types";

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get section type and context from request body
    const body = await request.json();
    const { sectionType, projectContext } = body as {
      sectionType: SectionType;
      projectContext?: string;
    };

    if (!sectionType) {
      return NextResponse.json(
        { error: "Section type is required" },
        { status: 400 }
      );
    }

    // Get the prompt template for this section
    const promptTemplate = SECTION_PROMPTS[sectionType];
    if (!promptTemplate) {
      return NextResponse.json(
        { error: "Invalid section type" },
        { status: 400 }
      );
    }

    // Generate AI-powered follow-up questions based on project context
    let customQuestions = promptTemplate.questions;

    if (projectContext && promptTemplate.followUpPrompt) {
      try {
        const followUpResponse = await generateCompletion(
          promptTemplate.systemPrompt,
          `${promptTemplate.followUpPrompt}\n\nProject context: ${projectContext}\n\nGenerate 4-5 specific, thoughtful questions that will help the team think deeply about this aspect of their product. Return only the questions, one per line, starting with a bullet point.`
        );

        // Parse the AI response into questions
        const aiQuestions = followUpResponse
          .split("\n")
          .filter((line) => line.trim().startsWith("•") || line.trim().startsWith("-"))
          .map((line) => line.replace(/^[•\-]\s*/, "").trim())
          .filter((q) => q.length > 0);

        if (aiQuestions.length > 0) {
          customQuestions = aiQuestions;
        }
      } catch (error) {
        console.error("Error generating custom questions:", error);
        // Fall back to default questions if AI generation fails
      }
    }

    return NextResponse.json({
      title: promptTemplate.questions[0]?.split("?")[0] || "Questions",
      questions: customQuestions,
      systemPrompt: promptTemplate.systemPrompt,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

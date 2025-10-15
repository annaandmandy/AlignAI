import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { generateEmbedding } from "@/lib/ai/openai";

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

    // Get response data from request body
    const body = await request.json();
    const { sectionId, content, isDraft } = body as {
      sectionId: string;
      content: string;
      isDraft?: boolean;
    };

    if (!sectionId || !content?.trim()) {
      return NextResponse.json(
        { error: "Section ID and content are required" },
        { status: 400 }
      );
    }

    // Generate embedding for the response content (only for submitted responses, not drafts)
    let embedding: number[] | null = null;
    if (!isDraft) {
      try {
        embedding = await generateEmbedding(content);
      } catch (error) {
        console.error("Error generating embedding:", error);
        // Continue without embedding - we'll handle this gracefully
      }
    }

    // Check if user already has a response for this section
    const { data: existingResponse, error: checkError } = await supabase
      .from("responses")
      .select("id")
      .eq("section_id", sectionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing response:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing response" },
        { status: 500 }
      );
    }

    let response;

    if (existingResponse) {
      // Update existing response
      const { data, error: updateError } = await supabase
        .from("responses")
        .update({
          content: content.trim(),
          embedding: embedding,
          is_draft: isDraft || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingResponse.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating response:", updateError);
        return NextResponse.json(
          { error: "Failed to update response" },
          { status: 500 }
        );
      }

      response = data;
    } else {
      // Create new response
      const { data, error: insertError } = await supabase
        .from("responses")
        .insert({
          section_id: sectionId,
          user_id: user.id,
          content: content.trim(),
          embedding: embedding,
          is_draft: isDraft || false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating response:", insertError);
        return NextResponse.json(
          { error: "Failed to create response" },
          { status: 500 }
        );
      }

      response = data;
    }

    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header");
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
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get section ID from query params
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      return NextResponse.json(
        { error: "Section ID is required" },
        { status: 400 }
      );
    }

    // Fetch all responses for this section
    console.log("Fetching responses for section:", sectionId);
    const { data: responses, error: fetchError } = await supabase
      .from("responses")
      .select("*")
      .eq("section_id", sectionId)
      .eq("is_draft", false)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching responses:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch responses", details: fetchError.message },
        { status: 500 }
      );
    }

    console.log("Found responses:", responses?.length || 0);

    // Fetch user profiles separately for each response
    const responsesWithUsers = await Promise.all(
      (responses || []).map(async (response) => {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", response.user_id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        return {
          ...response,
          user: profile,
        };
      })
    );

    return NextResponse.json({ responses: responsesWithUsers }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

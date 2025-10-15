// app/api/ai/section-draft/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { projectId, sectionType, current } = await req.json();

    // TODO: 在這裡串你的 LLM/RAG
    // 這裡先回一段示範文字
    const demo = `Suggested outline for ${sectionType}:
- Key point A
- Key point B
- Key risk & metric
(Replace this with your AI agent output)`;

    return NextResponse.json({ draft: demo });
  } catch (e) {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

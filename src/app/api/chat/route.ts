import { NextResponse } from "next/server";
import { generateRecommendation } from "@/lib/llm";
import type { ChatMessage } from "@/lib/types";

export const POST = async (req: Request) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: "body.messages must be an array" },
      { status: 400 }
    );
  }

  try {
    const result = await generateRecommendation(messages as ChatMessage[]);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

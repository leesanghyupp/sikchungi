import { NextResponse } from "next/server";
import { generateRecommendation } from "@/lib/llm";
import { detectDirectFood } from "@/lib/foodKeywords";
import type { ChatMessage } from "@/lib/types";

const REJECTION_TOKENS = ["말고", "말구", "싫어", "별로", "안 먹", "안먹"];

const isRejection = (text: string): boolean =>
  REJECTION_TOKENS.some((t) => text.includes(t));

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

  const typed = messages as ChatMessage[];
  const lastUser = [...typed].reverse().find((m) => m.role === "user");
  const lastText = lastUser?.content ?? "";

  const directFood =
    !isRejection(lastText) ? detectDirectFood(lastText) : null;

  try {
    const result = await generateRecommendation(typed, {
      directFood: directFood ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

import "server-only";
import { GoogleGenAI, Type } from "@google/genai";
import { env } from "./env";
import { SYSTEM_PROMPT } from "./prompt";
import type { AgentResponse, ChatMessage } from "./types";

const ai = new GoogleGenAI({ apiKey: env.googleApiKey });

const MODEL = "gemini-2.5-flash";

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING, enum: ["asking", "recommending"] },
    message: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          reason: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          imageQuery: { type: Type.STRING },
        },
        required: ["name", "reason", "tags", "imageQuery"],
      },
    },
    contextSummary: { type: Type.STRING },
  },
  required: ["status"],
};

const toGeminiContents = (messages: ChatMessage[]) =>
  messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

export const generateRecommendation = async (
  messages: ChatMessage[]
): Promise<AgentResponse> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: toGeminiContents(messages),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const usage = response.usageMetadata;
  if (usage) {
    console.log(
      `[gemini] prompt=${usage.promptTokenCount ?? "?"} cached=${
        usage.cachedContentTokenCount ?? 0
      } output=${usage.candidatesTokenCount ?? "?"}`
    );
  }

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(text) as AgentResponse;

  if (parsed.status === "asking" && !parsed.message) {
    throw new Error("asking response missing 'message'");
  }
  if (parsed.status === "recommending") {
    if (!parsed.recommendations || parsed.recommendations.length !== 3) {
      throw new Error("recommending response must have exactly 3 recommendations");
    }
  }

  return parsed;
};

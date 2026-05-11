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
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

type GenerateOptions = {
  directFood?: string;
};

const buildSystemInstruction = (opts: GenerateOptions): string => {
  if (!opts.directFood) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}

[OVERRIDE — 최우선]
사용자 메시지에서 음식 "${opts.directFood}"가 명시적으로 언급됨. 추가 질문 절대 하지 말고 즉시 status="recommending"으로 답변. recommendations[0].name은 반드시 "${opts.directFood}". 나머지 2개는 "${opts.directFood}"와 결이 비슷한 다른 음식. contextSummary는 "${opts.directFood} 직접 요청 / ..." 형태로 시작.`;
};

export const generateRecommendation = async (
  messages: ChatMessage[],
  options: GenerateOptions = {}
): Promise<AgentResponse> => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: toGeminiContents(messages),
    config: {
      systemInstruction: buildSystemInstruction(options),
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.4,
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

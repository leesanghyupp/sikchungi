import "server-only";
import type { AgentResponse, ChatMessage } from "./types";

export const generateRecommendation = async (
  _messages: ChatMessage[]
): Promise<AgentResponse> => {
  throw new Error("generateRecommendation: not implemented (step 5)");
};

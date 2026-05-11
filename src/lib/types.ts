export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export type FoodRecommendation = {
  name: string;
  reason: string;
  tags: string[];
  imageQuery: string;
};

export type AgentResponse =
  | { status: "asking"; message: string }
  | {
      status: "recommending";
      recommendations: FoodRecommendation[];
      contextSummary: string;
    };

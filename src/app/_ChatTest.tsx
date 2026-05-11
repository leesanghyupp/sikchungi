"use client";

import { useState } from "react";
import type { AgentResponse, ChatMessage } from "@/lib/types";

export const ChatTest = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!input.trim() || loading) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      const agentResp = data as AgentResponse;
      setLastResponse(agentResp);

      const assistantText =
        agentResp.status === "asking"
          ? agentResp.message
          : `[추천 3개 도착] ${agentResp.recommendations
              .map((r) => r.name)
              .join(" / ")}`;

      setMessages([
        ...next,
        { role: "assistant", content: assistantText },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setLastResponse(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">🍽️ 식충이 (테스트 모드)</h1>
        <button
          onClick={reset}
          className="px-3 py-1 text-sm rounded bg-muted text-muted-foreground hover:opacity-80"
        >
          새 대화
        </button>
      </header>

      <p className="text-sm text-muted-foreground">
        ※ 이 화면은 API 동작 확인용 임시 UI. 정식 채팅 UI는 6단계 작업.
      </p>

      <div className="space-y-2 min-h-[200px] p-4 rounded-lg bg-card border border-border">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm">아래에 메시지 입력하고 보내봐 ㄱㄱ</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg ${
              m.role === "user"
                ? "bg-primary text-primary-foreground ml-12"
                : "bg-secondary text-secondary-foreground mr-12"
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {m.role === "user" ? "나" : "식충이"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="p-3 rounded-lg bg-secondary text-secondary-foreground mr-12 animate-pulse">
            식충이가 생각 중... 🤤
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
          placeholder="예: 점심 뭐 먹지"
          className="flex-1 px-3 py-2 rounded border border-input bg-background text-foreground"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
        >
          전송
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">
          에러: {error}
        </div>
      )}

      {lastResponse && lastResponse.status === "recommending" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {lastResponse.recommendations.map((r, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-card border border-border space-y-2"
            >
              <div className="font-bold text-primary">{r.name}</div>
              <div className="text-sm text-foreground">{r.reason}</div>
              <div className="flex flex-wrap gap-1">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                🔍 {r.imageQuery}
              </div>
            </div>
          ))}
        </div>
      )}

      {lastResponse && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            원본 JSON 보기
          </summary>
          <pre className="mt-2 p-3 rounded bg-muted text-muted-foreground overflow-x-auto">
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

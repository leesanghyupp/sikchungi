"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { AgentResponse, ChatMessage, FoodRecommendation } from "@/lib/types";

type Event =
  | { role: "user"; text: string }
  | { role: "assistant"; resp: AgentResponse };

type ErrorInfo = { kind: "network" | "server"; message: string };

const eventToApiMessage = (e: Event): ChatMessage =>
  e.role === "user"
    ? { role: "user", content: e.text }
    : { role: "assistant", content: JSON.stringify(e.resp) };

const latestRecommendations = (events: Event[]): FoodRecommendation[] | null => {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.role === "assistant") {
      return e.resp.status === "recommending" ? e.resp.recommendations : null;
    }
  }
  return null;
};

export const ChatClient = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorInfo | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [events, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const runCompletion = async (eventsToSend: Event[]) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: eventsToSend.map(eventToApiMessage) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError({
          kind: "server",
          message: data.error ?? `HTTP ${res.status}`,
        });
        return;
      }

      setEvents([
        ...eventsToSend,
        { role: "assistant", resp: data as AgentResponse },
      ]);
    } catch (e) {
      setError({
        kind: "network",
        message: e instanceof Error ? e.message : "unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const next: Event[] = [...events, { role: "user", text }];
    setEvents(next);
    setInput("");
    await runCompletion(next);
  };

  const retryLast = () => {
    if (loading) return;
    void runCompletion(events);
  };

  const requestAnother = () => sendMessage("이거 말고 다른 거 ㄱㄱ");

  const reset = () => {
    setEvents([]);
    setInput("");
    setError(null);
  };

  const recs = latestRecommendations(events);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.svg" alt="식충이" className="h-10 w-10" />
          <div>
            <h1 className="font-heading text-lg font-bold text-primary leading-none">
              식충이
            </h1>
            <p className="text-xs text-muted-foreground">뭐 먹지? 🤤</p>
          </div>
        </div>
        {events.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            새 대화
          </Button>
        )}
      </header>

      <main className="flex-1">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
          {events.length === 0 && <WelcomeMessage />}

          {events.map((e, i) => {
            if (e.role === "user") {
              return <UserBubble key={i} text={e.text} />;
            }
            if (e.resp.status === "asking") {
              return <AssistantBubble key={i} text={e.resp.message} />;
            }
            return (
              <AssistantBubble
                key={i}
                text={`골랐어 ㄱㄱ — ${e.resp.contextSummary ?? "추천 3개 도착 🔥"}`}
              />
            );
          })}

          {recs && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {recs.map((r, i) => (
                  <RecommendationCard key={`${r.name}-${i}`} rec={r} />
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  onClick={requestAnother}
                  disabled={loading}
                >
                  다른 거 추천 받기 🔄
                </Button>
              </div>
            </div>
          )}

          {loading && <LoadingBubble />}

          {error && (
            <ErrorBanner
              error={error}
              onRetry={retryLast}
              disabled={loading}
            />
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <Input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && sendMessage(input)
            }
            placeholder="예: 점심 뭐 먹지"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            전송
          </Button>
        </div>
      </footer>
    </div>
  );
};

const WelcomeMessage = () => (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/mascot.svg" alt="식충이" className="h-32 w-32" />
    <h2 className="font-heading text-xl font-bold text-foreground">
      안녕! 나 식충이임 🤤
    </h2>
    <p className="max-w-xs text-sm text-muted-foreground">
      뭐 먹을지 고민되면 말해줘. 지금 끼니랑 컨디션 알려주면 ㄹㅇ 딱 맞는 거 골라줄게 🔥
    </p>
  </div>
);

const UserBubble = ({ text }: { text: string }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground">
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  </div>
);

const AssistantBubble = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/mascot.svg"
      alt="식충이"
      className="h-8 w-8 shrink-0 rounded-full bg-card p-0.5 ring-1 ring-border"
    />
    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card px-4 py-2 text-card-foreground ring-1 ring-border">
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  </div>
);

const LOADING_MESSAGES_EARLY = [
  "생각 중... 🤔",
  "음... 뭐가 좋을까 🤤",
  "머리 굴리는 중 🤖",
];

const LoadingBubble = () => {
  const [elapsed, setElapsed] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      setElapsed(Date.now() - start);
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES_EARLY.length);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const text =
    elapsed > 6000
      ? "거의 다 됨... 🔥"
      : LOADING_MESSAGES_EARLY[msgIdx];

  return (
    <div className="flex items-start gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot.svg"
        alt="식충이"
        className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-card p-0.5 ring-1 ring-border"
      />
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card px-4 py-2 text-card-foreground ring-1 ring-border">
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
};

const ErrorBanner = ({
  error,
  onRetry,
  disabled,
}: {
  error: ErrorInfo;
  onRetry: () => void;
  disabled: boolean;
}) => {
  const headline =
    error.kind === "network"
      ? "📡 인터넷 연결 확인해줘"
      : "😵 식충이가 잠깐 멈췄어";

  return (
    <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
      <div className="font-medium text-destructive">{headline}</div>
      <div className="text-destructive/80 text-xs">{error.message}</div>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetry}
        disabled={disabled}
      >
        다시 시도 🔄
      </Button>
    </div>
  );
};

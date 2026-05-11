"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  GeolocationError,
  getCurrentCoords,
  type Coords,
} from "@/lib/geolocation";

type Restaurant = {
  name: string;
  address: string;
  phone: string;
  url: string;
  category: string;
  distance: number;
};

type State =
  | { kind: "locating" }
  | { kind: "loading"; coords: Coords }
  | { kind: "loaded"; restaurants: Restaurant[] }
  | { kind: "empty" }
  | { kind: "error"; message: string };

const formatDistance = (m: number) =>
  m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;

const cleanCategory = (c: string) => c.split(" > ").slice(-1)[0] || c;

const geoErrorMessage = (e: unknown): string => {
  if (e instanceof GeolocationError) {
    switch (e.kind) {
      case "denied":
        return "위치 권한이 거부됐어. 브라우저 설정에서 허용해주면 근처 식당 찾아줄게 📍";
      case "unsupported":
        return "이 브라우저는 위치 기능을 지원 안 해 😢";
      case "timeout":
        return "위치 가져오는 데 시간이 너무 걸려. 다시 시도해봐 🔄";
      default:
        return "위치를 가져올 수 없어. 잠시 후 다시 시도해봐";
    }
  }
  return e instanceof Error ? e.message : "unknown error";
};

export const RestaurantSheet = ({
  foodName,
  open,
  onOpenChange,
}: {
  foodName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [state, setState] = useState<State>({ kind: "locating" });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const run = async () => {
      setState({ kind: "locating" });

      let coords: Coords;
      try {
        coords = await getCurrentCoords();
      } catch (e) {
        if (!cancelled) {
          setState({ kind: "error", message: geoErrorMessage(e) });
        }
        return;
      }

      if (cancelled) return;
      setState({ kind: "loading", coords });

      try {
        const res = await fetch(
          `/api/restaurants?q=${encodeURIComponent(foodName)}&lat=${coords.lat}&lng=${coords.lng}`
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState({
            kind: "error",
            message: data.error ?? `HTTP ${res.status}`,
          });
          return;
        }

        const restaurants: Restaurant[] = data.restaurants ?? [];
        setState(
          restaurants.length === 0
            ? { kind: "empty" }
            : { kind: "loaded", restaurants }
        );
      } catch (e) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: e instanceof Error ? e.message : "unknown error",
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, foodName, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-primary">
            {foodName} 근처 식당 📍
          </SheetTitle>
          <SheetDescription>
            현재 위치 기준 1.5km 이내 음식점
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-4 pb-6">
          {(state.kind === "locating" || state.kind === "loading") && (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              {state.kind === "locating"
                ? "📍 위치 확인 중..."
                : "🍳 식당 찾는 중..."}
            </div>
          )}

          {state.kind === "empty" && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              주변에 {foodName} 가게가 안 보임 😢
              <br />
              범위를 더 넓혀보거나 다른 음식으로 가보자
            </div>
          )}

          {state.kind === "error" && (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
              <div className="text-destructive">{state.message}</div>
              <Button variant="secondary" size="sm" onClick={retry}>
                다시 시도 🔄
              </Button>
            </div>
          )}

          {state.kind === "loaded" && (
            <ul className="space-y-2">
              {state.restaurants.map((r, i) => (
                <li key={`${r.url}-${i}`}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {r.name}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {formatDistance(r.distance)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {cleanCategory(r.category)} · {r.address}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RestaurantSheet } from "@/components/RestaurantSheet";
import type { FoodRecommendation } from "@/lib/types";

export const RecommendationCard = ({ rec }: { rec: FoodRecommendation }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);
    setImgLoaded(false);

    fetch(`/api/image?q=${encodeURIComponent(rec.imageQuery)}`)
      .then((r) => r.json())
      .then((data: { url: string | null }) => {
        if (!cancelled) setImageUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setImageUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rec.imageQuery]);

  return (
    <>
      <Card>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {(loading || (imageUrl && !imgLoaded)) && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          {!loading && imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={rec.name}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          )}
          {!loading && !imageUrl && (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mascot.svg"
                alt="식충이"
                className="h-20 w-20 opacity-40"
              />
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col gap-3">
          <CardTitle className="text-xl text-primary">{rec.name}</CardTitle>
          <p className="whitespace-pre-wrap text-foreground">{rec.reason}</p>
          <div className="flex min-h-[3.5rem] flex-wrap content-start gap-1.5 pt-1">
            {rec.tags.map((t) => (
              <span
                key={t}
                className="h-fit rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-auto w-full"
            onClick={() => setSheetOpen(true)}
          >
            근처 식당 보기 📍
          </Button>
        </CardContent>
      </Card>

      <RestaurantSheet
        foodName={rec.name}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};

import "server-only";
import { env } from "./env";

type UnsplashSearchResponse = {
  results: Array<{
    urls: { regular: string };
    alt_description: string | null;
  }>;
};

const searchOnce = async (query: string): Promise<string | null> => {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "landscape");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${env.unsplashAccessKey}` },
  });

  if (!res.ok) {
    throw new Error(`Unsplash API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as UnsplashSearchResponse;
  return data.results[0]?.urls.regular ?? null;
};

const fallbackQueries = (query: string): string[] => {
  const words = query.trim().split(/\s+/);
  if (words.length <= 1) return [];
  return [words[words.length - 1], words[0]].filter(
    (w, i, arr) => w && arr.indexOf(w) === i
  );
};

export const searchFoodImage = async (
  query: string
): Promise<string | null> => {
  const candidates = [query, ...fallbackQueries(query)];
  for (const q of candidates) {
    const url = await searchOnce(q);
    if (url) return url;
  }
  return null;
};

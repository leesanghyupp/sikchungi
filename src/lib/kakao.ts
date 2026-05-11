import "server-only";
import { env } from "./env";

export type KakaoRestaurant = {
  name: string;
  address: string;
  phone: string;
  url: string;
  category: string;
  distance: number;
};

type KakaoSearchResponse = {
  documents: Array<{
    place_name: string;
    road_address_name: string;
    address_name: string;
    phone: string;
    place_url: string;
    category_name: string;
    distance: string;
  }>;
};

export const searchRestaurants = async (
  query: string,
  lat: number,
  lng: number,
  options?: { radius?: number; size?: number }
): Promise<KakaoRestaurant[]> => {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));
  url.searchParams.set("radius", String(options?.radius ?? 1500));
  url.searchParams.set("size", String(options?.size ?? 5));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("category_group_code", "FD6");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${env.kakaoRestApiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Kakao API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as KakaoSearchResponse;

  return data.documents.map((d) => ({
    name: d.place_name,
    address: d.road_address_name || d.address_name,
    phone: d.phone,
    url: d.place_url,
    category: d.category_name,
    distance: Number(d.distance) || 0,
  }));
};

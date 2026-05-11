import { NextResponse } from "next/server";
import { searchRestaurants } from "@/lib/kakao";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!query) {
    return NextResponse.json({ error: "missing q" }, { status: 400 });
  }
  if (!lat || !lng) {
    return NextResponse.json(
      { error: "missing lat/lng" },
      { status: 400 }
    );
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    return NextResponse.json(
      { error: "invalid lat/lng" },
      { status: 400 }
    );
  }

  try {
    const restaurants = await searchRestaurants(query, latNum, lngNum);
    return NextResponse.json({ restaurants });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

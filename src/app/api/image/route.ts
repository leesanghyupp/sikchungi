import { NextResponse } from "next/server";
import { searchFoodImage } from "@/lib/unsplash";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "missing q param" }, { status: 400 });
  }

  try {
    const url = await searchFoodImage(query);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

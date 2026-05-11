import { NextResponse } from "next/server";

export const POST = async (_req: Request) => {
  return NextResponse.json(
    { error: "not implemented" },
    { status: 501 }
  );
};

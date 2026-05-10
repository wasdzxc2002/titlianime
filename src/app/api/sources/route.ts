import { NextRequest, NextResponse } from "next/server";
import { getPlayback, type Provider, type Category } from "@/lib/miruro";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const provider = sp.get("provider") as Provider | null;
  const anilistIdRaw = sp.get("anilistId");
  const slug = sp.get("slug");
  const categoryRaw = sp.get("category");
  const category: Category = categoryRaw === "dub" ? "dub" : "sub";

  if (!provider || !anilistIdRaw || !slug) {
    return NextResponse.json(
      { error: "provider, anilistId, slug are required" },
      { status: 400 }
    );
  }
  const anilistId = parseInt(anilistIdRaw);
  if (Number.isNaN(anilistId)) {
    return NextResponse.json({ error: "anilistId must be a number" }, { status: 400 });
  }

  try {
    const playback = await getPlayback(provider, anilistId, category, slug);
    return NextResponse.json(playback);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch sources from provider" },
      { status: 502 }
    );
  }
}

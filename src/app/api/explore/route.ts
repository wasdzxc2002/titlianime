import { NextRequest, NextResponse } from "next/server";
import { searchAniList, anilistToBasic } from "@/lib/anilist";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "";
  const format = searchParams.get("format") || "";
  const status = searchParams.get("status") || "";
  const year = searchParams.get("year") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  try {
    const { media, hasNextPage } = await searchAniList(query, {
      genre: genre || undefined,
      format: format || undefined,
      status: status || undefined,
      year: year ? parseInt(year) : undefined,
      page,
      perPage: 24,
    });

    const results = media.map(anilistToBasic);

    return NextResponse.json({
      results,
      hasMore: hasNextPage,
      total: results.length,
    });
  } catch (err) {
    console.error("Explore API error:", err);
    return NextResponse.json({ results: [], hasMore: false, total: 0 });
  }
}

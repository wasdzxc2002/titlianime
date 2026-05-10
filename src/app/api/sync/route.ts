import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sync
 *
 * Server-side proxy for MAL/AniList list sync.
 * Needed because MAL's API doesn't support CORS (browser fetch fails).
 *
 * Body: { provider, accessToken, anilistId, malId?, episodesWatched, totalEpisodes? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider,
      accessToken,
      anilistId,
      malId,
      episodesWatched,
      totalEpisodes,
    } = body as {
      provider: "mal" | "anilist";
      accessToken: string;
      anilistId: number;
      malId?: number;
      episodesWatched: number;
      totalEpisodes?: number;
    };

    if (!provider || !accessToken || !anilistId || episodesWatched == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const isCompleted =
      totalEpisodes != null &&
      totalEpisodes > 0 &&
      episodesWatched >= totalEpisodes;

    if (provider === "mal") {
      const id = malId || anilistId;
      const params = new URLSearchParams();
      params.set("status", isCompleted ? "completed" : "watching");
      params.set("num_watched_episodes", String(episodesWatched));

      const res = await fetch(
        `https://api.myanimelist.net/v2/anime/${id}/my_list_status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("[sync/mal] API error:", res.status, text);
        return NextResponse.json(
          { error: "MAL sync failed", detail: text },
          { status: res.status }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // AniList
    const variables: Record<string, unknown> = {
      mediaId: anilistId,
      status: isCompleted ? "COMPLETED" : "CURRENT",
      progress: episodesWatched,
    };

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: `mutation($mediaId: Int, $status: MediaListStatus, $progress: Int) {
          SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress) {
            id status progress
          }
        }`,
        variables,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[sync/anilist] API error:", res.status, text);
      return NextResponse.json(
        { error: "AniList sync failed", detail: text },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sync] unexpected error:", err);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}

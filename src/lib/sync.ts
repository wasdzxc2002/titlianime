/**
 * Sync utilities — update anime list status and episode progress on MAL / AniList.
 *
 * All calls go through our /api/sync server route to avoid CORS issues
 * (MAL's API doesn't allow browser-origin requests).
 *
 * Functions are fire-and-forget: they log errors but never throw,
 * so a failed sync never breaks the watching experience.
 */

interface SyncParams {
  provider: "mal" | "anilist";
  accessToken: string;
  anilistId: number;
  /** MAL needs its own ID — passed from AniList's idMal field */
  malId?: number;
  episodesWatched: number;
  totalEpisodes?: number;
}

/**
 * Sync episode progress to MAL or AniList via our server proxy.
 * Automatically determines status (watching vs completed).
 */
export async function syncEpisodeProgress(params: SyncParams) {
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (err) {
    // Fire-and-forget: never let sync failures break the watching experience
    console.error("[syncEpisodeProgress] failed:", err);
  }
}

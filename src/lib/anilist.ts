const ANILIST_URL = "https://graphql.anilist.co";

async function anilistQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(6000),
  });
  const json = await res.json() as { data: T; errors?: unknown[] };
  if (json.errors) throw new Error("AniList GraphQL error");
  return json.data;
}

const MEDIA_FRAGMENT = `
  id idMal title { romaji english native }
  coverImage { extraLarge large medium color }
  bannerImage description(asHtml: false)
  averageScore meanScore popularity favourites
  episodes status format source
  genres tags { name } startDate { year month day }
  season seasonYear studios(isMain: true) { nodes { name } }
  nextAiringEpisode { airingAt episode timeUntilAiring }
  trailer { id site thumbnail }
  characters(sort: ROLE, perPage: 8) {
    edges { role node { id name { full } image { large medium } }
    voiceActors(language: JAPANESE) { id name { full } image { large medium } } }
  }
  recommendations(sort: RATING_DESC, perPage: 8) {
    nodes { mediaRecommendation { id idMal title { romaji english } coverImage { large medium } averageScore } }
  }
`;

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: { romaji: string; english?: string; native?: string };
  coverImage: { extraLarge?: string; large?: string; medium?: string; color?: string };
  bannerImage?: string;
  description?: string;
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  episodes?: number;
  status?: string;
  format?: string;
  source?: string;
  genres?: string[];
  season?: string;
  seasonYear?: number;
  studios?: { nodes: Array<{ name: string }> };
  nextAiringEpisode?: { airingAt: number; episode: number; timeUntilAiring: number };
  trailer?: { id: string; site: string; thumbnail: string };
  characters?: {
    edges: Array<{
      role: string;
      node: { id: number; name: { full: string }; image: { large?: string } };
      voiceActors: Array<{ id: number; name: { full: string }; image: { large?: string } }>;
    }>;
  };
  recommendations?: {
    nodes: Array<{
      mediaRecommendation: {
        id: number;
        title: { romaji: string; english?: string };
        coverImage: { large?: string; medium?: string };
        averageScore?: number;
      };
    }>;
  };
}

interface Page<T> { Page: { media: T[]; pageInfo: { hasNextPage: boolean; total: number } } }

export async function getAiringSchedule(
  page = 1,
  perPage = 50
): Promise<{ id: number; title: string; image: string; episode: number; airingAt: number }[]> {
  const now = Math.floor(Date.now() / 1000);
  const weekEnd = now + 7 * 24 * 3600;
  const query = `
    query($page: Int, $perPage: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: $perPage) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id airingAt episode
          media { id title { romaji english } coverImage { large medium } }
        }
      }
    }`;
  const data = await anilistQuery<{ Page: { airingSchedules: Array<{ id: number; airingAt: number; episode: number; media: AniListMedia }> } }>(
    query,
    { page, perPage, start: now - 3600, end: weekEnd }
  );
  return data.Page.airingSchedules.map((s) => ({
    id: s.media.id,
    title: s.media.title.english || s.media.title.romaji,
    image: s.media.coverImage.large || s.media.coverImage.medium || "",
    episode: s.episode,
    airingAt: s.airingAt,
  }));
}

export async function getTrending(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const query = `query($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC, status_not: NOT_YET_RELEASED) { ${MEDIA_FRAGMENT} }
    }
  }`;
  const data = await anilistQuery<Page<AniListMedia>>(query, { page, perPage });
  return data.Page.media;
}

export async function getPopular(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const query = `query($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC) { ${MEDIA_FRAGMENT} }
    }
  }`;
  const data = await anilistQuery<Page<AniListMedia>>(query, { page, perPage });
  return data.Page.media;
}

export async function getUpcoming(page = 1, perPage = 20): Promise<AniListMedia[]> {
  const query = `query($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) { ${MEDIA_FRAGMENT} }
    }
  }`;
  const data = await anilistQuery<Page<AniListMedia>>(query, { page, perPage });
  return data.Page.media;
}

export async function getTopMovies(page = 1, perPage = 10): Promise<AniListMedia[]> {
  const query = `query($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, format: MOVIE, sort: SCORE_DESC, averageScore_greater: 70) { ${MEDIA_FRAGMENT} }
    }
  }`;
  const data = await anilistQuery<Page<AniListMedia>>(query, { page, perPage });
  return data.Page.media;
}

export async function getAniListById(id: number): Promise<AniListMedia> {
  const query = `query($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FRAGMENT} } }`;
  const data = await anilistQuery<{ Media: AniListMedia }>(query, { id });
  return data.Media;
}

export async function getAniListByMalId(malId: number): Promise<AniListMedia> {
  const query = `query($malId: Int) { Media(idMal: $malId, type: ANIME) { ${MEDIA_FRAGMENT} } }`;
  const data = await anilistQuery<{ Media: AniListMedia }>(query, { malId });
  return data.Media;
}

export async function searchAniList(
  query: string,
  { genre, format, status, year, page = 1, perPage = 24 }: {
    genre?: string; format?: string; status?: string; year?: number; page?: number; perPage?: number;
  } = {}
): Promise<{ media: AniListMedia[]; hasNextPage: boolean }> {
  const vars: Record<string, unknown> = { page, perPage };
  const args: string[] = ["$page: Int", "$perPage: Int"];
  const filters: string[] = ["type: ANIME"];

  if (query) { vars.search = query; args.push("$search: String"); filters.push("search: $search"); }
  if (genre) { vars.genre = genre; args.push("$genre: String"); filters.push("genre: $genre"); }
  if (format) {
    vars.format = format.toUpperCase();
    args.push("$format: MediaFormat");
    filters.push("format: $format");
  }
  if (status) {
    const statusMap: Record<string, string> = {
      airing: "RELEASING", finished: "FINISHED", upcoming: "NOT_YET_RELEASED",
    };
    vars.status = statusMap[status.toLowerCase()] || status;
    args.push("$status: MediaStatus");
    filters.push("status: $status");
  }
  if (year) { vars.seasonYear = year; args.push("$seasonYear: Int"); filters.push("seasonYear: $seasonYear"); }
  if (!query) filters.push("sort: POPULARITY_DESC");

  const q = `query(${args.join(", ")}) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(${filters.join(", ")}) { ${MEDIA_FRAGMENT} }
    }
  }`;
  const data = await anilistQuery<Page<AniListMedia> & { Page: { pageInfo: { hasNextPage: boolean } } }>(q, vars);
  return { media: data.Page.media, hasNextPage: data.Page.pageInfo.hasNextPage };
}

export function anilistToBasic(m: AniListMedia) {
  return {
    id: m.id,
    title: m.title.english || m.title.romaji,
    image: m.coverImage.extraLarge || m.coverImage.large || m.coverImage.medium || "/placeholder.jpg",
    bannerImage: m.bannerImage || null,
    score: m.averageScore ? m.averageScore / 10 : undefined,
    episodes: m.episodes,
    status: m.status,
    genres: m.genres,
    year: m.seasonYear,
    season: m.season?.toLowerCase(),
    format: m.format?.toLowerCase(),
    synopsis: m.description,
  };
}

const MAL_BASE = "https://api.myanimelist.net/v2";
const CLIENT_ID = process.env.NEXT_PUBLIC_MAL_CLIENT_ID || "6b5395a6f5541009ee64c33587107901";

const LISTING_FIELDS =
  "id,title,main_picture,alternative_titles,synopsis,mean,media_type,status,genres,num_episodes,start_season,source,rating,studios";

const DETAIL_FIELDS =
  "id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_favorites,media_type,status,genres,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,recommendations,studios";

async function malFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${MAL_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { "X-MAL-CLIENT-ID": CLIENT_ID },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`MAL API error: ${res.status}`);
  return res.json() as T;
}

export interface MALAnime {
  id: number;
  title: string;
  main_picture?: { medium: string; large: string };
  alternative_titles?: { en?: string; ja?: string };
  synopsis?: string;
  mean?: number;
  rank?: number;
  popularity?: number;
  num_episodes?: number;
  status?: string;
  genres?: Array<{ id: number; name: string }>;
  start_season?: { year: number; season: string };
  source?: string;
  rating?: string;
  average_episode_duration?: number;
  studios?: Array<{ id: number; name: string }>;
  pictures?: Array<{ medium: string; large: string }>;
  background?: string;
  related_anime?: Array<{ node: MALAnime; relation_type: string; relation_type_formatted: string }>;
  recommendations?: Array<{ node: MALAnime; num_recommendations: number }>;
  start_date?: string;
  media_type?: string;
  broadcast?: { day_of_the_week: string; start_time: string };
}

interface MALList<T> {
  data: Array<{ node: T }>;
  paging?: { next?: string; previous?: string };
}

export async function getAnimeRanking(
  type: "all" | "airing" | "upcoming" | "tv" | "movie" | "bypopularity" | "favorite" = "airing",
  limit = 20
): Promise<MALAnime[]> {
  const data = await malFetch<MALList<MALAnime>>("/anime/ranking", {
    ranking_type: type,
    limit: String(limit),
    fields: LISTING_FIELDS,
  });
  return data.data.map((d) => d.node);
}

export async function getSeasonalAnime(
  year: number,
  season: string,
  limit = 24
): Promise<MALAnime[]> {
  const data = await malFetch<MALList<MALAnime>>(`/anime/season/${year}/${season}`, {
    limit: String(limit),
    fields: LISTING_FIELDS,
    sort: "anime_score",
  });
  return data.data.map((d) => d.node);
}

export async function getAnimeById(id: number): Promise<MALAnime> {
  return malFetch<MALAnime>(`/anime/${id}`, { fields: DETAIL_FIELDS });
}

export async function searchAnime(query: string, limit = 20): Promise<MALAnime[]> {
  const data = await malFetch<MALList<MALAnime>>("/anime", {
    q: query,
    limit: String(limit),
    fields: LISTING_FIELDS,
  });
  return data.data.map((d) => d.node);
}

export async function getRandomAnime(): Promise<MALAnime> {
  const rankings = await getAnimeRanking("bypopularity", 50);
  const idx = Math.floor(Math.random() * rankings.length);
  return rankings[idx];
}

export function malToBasic(anime: MALAnime) {
  return {
    id: anime.id,
    title: anime.alternative_titles?.en || anime.title,
    image: anime.main_picture?.large || anime.main_picture?.medium || "/placeholder.jpg",
    score: anime.mean,
    episodes: anime.num_episodes,
    status: anime.status,
    genres: anime.genres?.map((g) => g.name),
    year: anime.start_season?.year,
    season: anime.start_season?.season,
    format: anime.media_type,
    synopsis: anime.synopsis,
    studios: anime.studios?.map((s) => s.name),
    rating: anime.rating,
  };
}

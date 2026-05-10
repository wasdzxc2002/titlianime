// Wrapper around the user's self-hosted Miruro API on HF Space.
//
// API shape confirmed by probing (2026-05-09):
//   GET /episodes/{anilistId}
//     -> { mappings: {...}, providers: { arc, dune, kiwi, hop, bee } }
//        Each provider has { meta, episodes: { sub?, dub?, es? } }
//        Episode shape:
//          { id: "watch/{provider}/{anilistId}/{category}/{slug}",
//            number, title, airDate, duration, audio, image?, ... }
//
//   GET /watch/{provider}/{anilistId}/{category}/{slug}
//     -> EITHER { streams: [...], subtitles?: [...] }
//        OR     { ssub: { streams, subtitles }, sdub?: {...} }
//        Stream shape:
//          { url, type: "hls"|"embed", quality?, audio, referer, ... }
//
//   /sources query-form is broken (444 "Pipe request failed").
//   The /watch/{provider}/{id}/{cat}/{slug} path-form works — use that.
//
// Auth: X-API-Key + Referer + Origin headers required on every call.
// Stream CDNs require Referer too (403 without). Browsers can't set Referer
// from JS, so /api/hls proxies playlists, segments, keys, and subtitles.

const MIRURO_URL = process.env.MIRURO_URL?.replace(/\/$/, "") || "";
const MIRURO_API_KEY = process.env.MIRURO_API_KEY || "";

const AUTH_HEADERS: Record<string, string> = {
  "X-API-Key": MIRURO_API_KEY,
  Referer: "https://miruro.tv/",
  Origin: "https://miruro.tv",
};

async function miruroFetch<T>(path: string, revalidate = 600): Promise<T> {
  if (!MIRURO_URL) throw new Error("MIRURO_URL is not set");
  if (!MIRURO_API_KEY) throw new Error("MIRURO_API_KEY is not set");
  const res = await fetch(`${MIRURO_URL}${path}`, {
    headers: AUTH_HEADERS,
    next: { revalidate },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Miruro ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

// Internal provider keys returned by the API. The user's docs talk about
// "animepahe / animekai / hianime" — those are BRAND names, not valid path
// params. /watch/animepahe/... returns 404. Mapping:
//   kiwi  → AnimePahe   (slugs animepahe-N, streams kwik.cx/uwucdn)
//   bee   → HiAnime     (slugs anikoto-N,  streams watching.onl/vidcloud)
//   dune  → AnimeDunya  (slugs animedunya-N)
//   hop   → KickAssAnime (slugs kickassanime-N — typically broken)
//   arc   → unknown (often empty)
export type Provider = "kiwi" | "bee" | "dune" | "hop" | "arc";
export type Category = "sub" | "dub";

// Primary = AnimePahe (kiwi) per user; rest are fallbacks of decreasing reliability.
const PROVIDER_CASCADE: Provider[] = ["kiwi", "bee", "dune", "hop", "arc"];

export interface MiruroEpisode {
  id: string; // "watch/{provider}/{anilistId}/{category}/{slug}"
  number: number;
  title?: string;
  airDate?: string;
  duration?: number;
  audio?: string;
  description?: string;
  filler?: boolean;
  image?: string;
}

interface ProviderData {
  meta?: Record<string, unknown>;
  episodes?: Partial<Record<string, MiruroEpisode[]>>;
}

interface EpisodesResponse {
  mappings?: Record<string, unknown>;
  providers?: Partial<Record<Provider, ProviderData>>;
}

interface RawStream {
  url: string;
  type: string;
  quality?: string;
  audio?: string;
  referer?: string;
  isActive?: boolean;
  default?: boolean;
  priority?: number;
  server?: string;
}

interface RawSubtitle {
  file: string;
  label?: string;
  kind?: string;
  language?: string;
  default?: boolean;
}

export interface PlayableSource {
  url: string;        // Already proxied through /api/hls
  quality: string;
  isM3U8: boolean;
  origin: string;     // Original (non-proxied) URL — kept for debugging
}

export interface PlayableSubtitle {
  url: string;        // Proxied
  lang: string;
}

export interface Playback {
  sources: PlayableSource[];
  subtitles: PlayableSubtitle[];
}

export async function getEpisodes(anilistId: number): Promise<EpisodesResponse> {
  return miruroFetch<EpisodesResponse>(`/episodes/${anilistId}`, 1800);
}

// Picks the first provider whose data has at least one episode for the
// requested category. Returns null if no provider has playable episodes.
export function pickProvider(
  data: EpisodesResponse,
  category: Category
): Provider | null {
  if (!data.providers) return null;
  for (const p of PROVIDER_CASCADE) {
    const eps = data.providers[p]?.episodes?.[category];
    if (Array.isArray(eps) && eps.length > 0) return p;
  }
  return null;
}

// All providers that have episodes for ANY category (used for the UI switcher)
export function listAvailableProviders(data: EpisodesResponse): Provider[] {
  const out: Provider[] = [];
  for (const p of PROVIDER_CASCADE) {
    const cats = data.providers?.[p]?.episodes;
    if (!cats) continue;
    if (
      (Array.isArray(cats.sub) && cats.sub.length > 0) ||
      (Array.isArray(cats.dub) && cats.dub.length > 0)
    ) {
      out.push(p);
    }
  }
  return out;
}

export function getEpisodeList(
  data: EpisodesResponse,
  provider: Provider,
  category: Category
): MiruroEpisode[] {
  const eps = data.providers?.[provider]?.episodes?.[category];
  return Array.isArray(eps) ? eps : [];
}

// Episode IDs are "watch/{provider}/{anilistId}/{category}/{slug}".
// Extract the slug for use with the /watch/{...}/{slug} endpoint.
export function extractSlug(episodeId: string): string | null {
  const parts = episodeId.split("/");
  if (parts.length < 5) return null;
  return parts.slice(4).join("/");
}

function makeProxyUrl(rawUrl: string, referer: string | undefined): string {
  const r = referer || "";
  return `/api/hls?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent(r)}`;
}

function unwrapStreams(v: unknown): { streams: RawStream[]; subtitles: RawSubtitle[] } | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  if (!Array.isArray(obj.streams)) return null;
  return {
    streams: obj.streams as RawStream[],
    subtitles: (obj.subtitles as RawSubtitle[]) || [],
  };
}

function extractRaw(data: unknown, category: Category): { streams: RawStream[]; subtitles: RawSubtitle[] } {
  if (!data || typeof data !== "object") return { streams: [], subtitles: [] };
  const d = data as Record<string, unknown>;
  // Direct shape (kiwi): { streams: [...], subtitles?: [...] }
  if (Array.isArray(d.streams)) {
    return {
      streams: d.streams as RawStream[],
      subtitles: (d.subtitles as RawSubtitle[]) || [],
    };
  }
  // Wrapper shape (bee, dune): { ssub: { streams, subtitles }, sdub?: { ... } }
  // Pick the key matching the requested category first.
  const preferredKey = category === "dub" ? "sdub" : "ssub";
  const fallbackKey = category === "dub" ? "ssub" : "sdub";

  const preferred = unwrapStreams(d[preferredKey]);
  if (preferred && preferred.streams.length > 0) return preferred;

  const fallback = unwrapStreams(d[fallbackKey]);
  if (fallback && fallback.streams.length > 0) return fallback;

  // Last resort: try any key that has streams
  for (const key of Object.keys(d)) {
    const result = unwrapStreams(d[key]);
    if (result && result.streams.length > 0) return result;
  }
  return { streams: [], subtitles: [] };
}

export async function getPlayback(
  provider: Provider,
  anilistId: number,
  category: Category,
  slug: string
): Promise<Playback> {
  const safeSlug = slug.split("/").map(encodeURIComponent).join("/");
  const data = await miruroFetch<unknown>(
    `/watch/${provider}/${anilistId}/${category}/${safeSlug}`,
    300
  );
  const { streams, subtitles } = extractRaw(data, category);

  const sources: PlayableSource[] = streams
    .filter((s) => s && s.type === "hls" && s.url)
    .map((s) => ({
      origin: s.url,
      url: makeProxyUrl(s.url, s.referer),
      quality: s.quality || "auto",
      isM3U8: true,
    }));

  const subs: PlayableSubtitle[] = subtitles
    .filter((sb) => sb && sb.file)
    .map((sb) => ({
      url: makeProxyUrl(sb.file, undefined), // VTTs usually don't need Referer
      lang: sb.label || sb.language || "Unknown",
    }));

  return { sources, subtitles: subs };
}

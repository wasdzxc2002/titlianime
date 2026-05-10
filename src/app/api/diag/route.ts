// Pipeline diagnostic — visit /api/_diag?anilistId=154587 in the browser to
// see exactly what each layer returns. Helpful when the player is black and
// you don't know whether Miruro, the proxy, or hls.js is the failing link.
import { NextRequest, NextResponse } from "next/server";
import {
  getEpisodes,
  pickProvider,
  getEpisodeList,
  extractSlug,
  getPlayback,
  type Provider,
  type Category,
} from "@/lib/miruro";

export const dynamic = "force-dynamic";

interface Step {
  step: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const anilistId = parseInt(sp.get("anilistId") || "154587"); // Frieren default
  const epNum = parseInt(sp.get("ep") || "1");
  const wantProvider = sp.get("provider") as Provider | null;
  const wantCategory = (sp.get("category") || "sub") as Category;

  const env = {
    MIRURO_URL: process.env.MIRURO_URL ? "set" : "MISSING",
    MIRURO_API_KEY: process.env.MIRURO_API_KEY ? "set" : "MISSING",
  };

  const steps: Step[] = [];
  steps.push({ step: "env", ok: env.MIRURO_URL === "set" && env.MIRURO_API_KEY === "set", data: env });

  // Step 1: /episodes
  let episodesData;
  try {
    episodesData = await getEpisodes(anilistId);
    const provs = Object.keys(episodesData.providers || {});
    const counts: Record<string, Record<string, number>> = {};
    for (const p of provs) {
      const eps = episodesData.providers?.[p as Provider]?.episodes || {};
      counts[p] = {};
      for (const c of Object.keys(eps)) {
        const arr = eps[c];
        counts[p][c] = Array.isArray(arr) ? arr.length : 0;
      }
    }
    steps.push({ step: "miruro /episodes", ok: true, data: { providers: provs, counts } });
  } catch (e) {
    steps.push({ step: "miruro /episodes", ok: false, error: String(e) });
    return NextResponse.json({ anilistId, epNum, steps });
  }

  // Step 2: pick provider
  const provider = wantProvider || pickProvider(episodesData, wantCategory);
  if (!provider) {
    steps.push({ step: "pickProvider", ok: false, error: `no provider has ${wantCategory} episodes` });
    return NextResponse.json({ anilistId, epNum, steps });
  }
  steps.push({ step: "pickProvider", ok: true, data: { provider, category: wantCategory } });

  // Step 3: locate episode
  const eps = getEpisodeList(episodesData, provider, wantCategory);
  const ep = eps.find((e) => e.number === epNum) || eps[epNum - 1];
  if (!ep) {
    steps.push({ step: "locate episode", ok: false, error: `ep ${epNum} not in list of ${eps.length}` });
    return NextResponse.json({ anilistId, epNum, steps });
  }
  const slug = extractSlug(ep.id);
  steps.push({ step: "locate episode", ok: !!slug, data: { id: ep.id, slug } });
  if (!slug) return NextResponse.json({ anilistId, epNum, steps });

  // Step 4: /watch
  let playback;
  try {
    playback = await getPlayback(provider, anilistId, wantCategory, slug);
    steps.push({
      step: "miruro /watch (normalized)",
      ok: playback.sources.length > 0,
      data: {
        sourceCount: playback.sources.length,
        firstSourceProxied: playback.sources[0]?.url,
        firstSourceOrigin: playback.sources[0]?.origin,
        subtitleCount: playback.subtitles.length,
      },
    });
  } catch (e) {
    steps.push({ step: "miruro /watch", ok: false, error: String(e) });
    return NextResponse.json({ anilistId, epNum, steps });
  }

  // Step 5: proxy fetch the m3u8 (this is what hls.js will do client-side)
  if (playback.sources.length > 0) {
    try {
      // Build absolute proxy URL by reading our own origin from the request
      const origin = new URL(req.url).origin;
      const proxyUrl = new URL(playback.sources[0].url, origin).toString();
      const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
      const text = await r.text();
      const isPlaylist = text.startsWith("#EXTM3U");
      steps.push({
        step: "proxy fetch m3u8",
        ok: r.ok && isPlaylist,
        data: {
          status: r.status,
          contentType: r.headers.get("content-type"),
          isPlaylist,
          firstChars: text.slice(0, 220),
          bytes: text.length,
        },
      });
    } catch (e) {
      steps.push({ step: "proxy fetch m3u8", ok: false, error: String(e) });
    }
  }

  return NextResponse.json({ anilistId, epNum, steps });
}

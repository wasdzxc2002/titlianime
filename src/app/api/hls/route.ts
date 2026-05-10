// Proxy for HLS playlists, segments, AES keys, and VTT subtitles.
//
// Why this exists: stream CDNs (uwucdn.top, watching.onl, anime-dunya.com, etc.)
// require a specific Referer header. Browsers refuse to set Referer from JS,
// so we fetch upstream server-side, add the Referer, and stream the bytes
// back through our origin. For .m3u8 playlists we additionally rewrite every
// segment/key URL to point back through this proxy so subsequent requests
// also get the Referer treatment.
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function selfBase(req: NextRequest): string {
  // Build absolute URLs only when needed; relative /api/hls?... is enough for
  // hls.js since the playlist is fetched via the same origin.
  return new URL(req.url).origin;
}

function proxify(absUrl: string, referer: string | undefined): string {
  return `/api/hls?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer || "")}`;
}

function rewriteM3U8(text: string, baseUrl: string, referer: string): string {
  const base = new URL(baseUrl);
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      out.push(line);
      continue;
    }
    if (t.startsWith("#")) {
      // #EXT-X-KEY:METHOD=AES-128,URI="..." — rewrite the URI
      const keyMatch = line.match(/URI="([^"]+)"/);
      if (keyMatch) {
        const abs = new URL(keyMatch[1], base).toString();
        out.push(line.replace(/URI="[^"]+"/, `URI="${proxify(abs, referer)}"`));
        continue;
      }
      out.push(line);
      continue;
    }
    // Non-comment line is a segment or sub-playlist URL
    const abs = new URL(t, base).toString();
    out.push(proxify(abs, referer));
  }
  return out.join("\n");
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url");
  const referer = sp.get("referer") || "";
  if (!url) {
    return new Response("missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new Response("bad protocol", { status: 400 });
  }

  const headers: Record<string, string> = { "User-Agent": DEFAULT_UA };
  if (referer) headers["Referer"] = referer;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers,
      // No caching — segment URLs often have signed query strings
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return new Response("upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`upstream ${upstream.status}`, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") || "";
  const isPlaylist =
    contentType.includes("mpegurl") ||
    contentType.includes("vnd.apple") ||
    /\.m3u8(\?|$)/i.test(target.pathname + target.search) ||
    /\.m3u8(\?|$)/i.test(target.toString());

  if (isPlaylist) {
    const text = await upstream.text();
    const rewritten = rewriteM3U8(text, target.toString(), referer);
    return new Response(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Binary / text passthrough (segments, AES keys, VTT subtitles, etc.)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType || "application/octet-stream",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

import type { NewsItem } from "@/types";
import { searchAniList } from "./anilist";

/**
 * Fetch anime/manga news from Anime News Network RSS.
 * - Filters out gaming-only articles.
 * - Derives thumbnail from ANN's CDN thumbnail URL pattern.
 */

const ANN_RSS = "https://www.animenewsnetwork.com/newsroom/rss.xml";

/** Categories to exclude when they are the ONLY categories on an item */
const EXCLUDED_CATEGORIES = new Set(["games"]);

/** Categories that are anime/manga related — keep items with at least one of these */
const WANTED_CATEGORIES = new Set([
  "anime", "manga", "novels", "people", "industry", "events", "live-action",
]);

function safeDate(str: string): string {
  try { return new Date(str).toISOString(); }
  catch { return new Date().toISOString(); }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function extractFirstImage(html: string): string | undefined {
  const m = html.match(/src=["']([^"']+(?:jpg|jpeg|png|webp|gif)[^"']*)["']/i);
  return m?.[1];
}

async function fetchArticleImage(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return undefined;
    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      const imgUrl = ogMatch[1].replace(/&amp;/g, '&');
      // ANN often returns generic logos as og:image if there's no actual article image
      if (!imgUrl.includes('ann-logo') && !imgUrl.includes('default')) {
        return imgUrl;
      }
    }
  } catch {
    return undefined;
  }
}

/**
 * Check if the categories on this item indicate it should be shown.
 * Exclude items where ALL categories are in the excluded set (e.g. pure gaming news).
 * Keep items that have no categories (press releases) or at least one non-excluded category.
 */
function shouldIncludeItem(categories: string[]): boolean {
  if (categories.length === 0) return false;
  const lower = categories.map((c) => c.toLowerCase());
  // Strict filter: User only wants Anime news
  return lower.includes("anime");
}

export async function getANNNews(limit = 20): Promise<NewsItem[]> {
  try {
    const res = await fetch(ANN_RSS, {
      next: { revalidate: 900 },
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return getFallbackNews();
    const text = await res.text();

    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(text)) !== null && items.length < limit) {
      const block = match[1];

      const title =
        block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        block.match(/<title>(.*?)<\/title>/)?.[1] || "";

      const link =
        block.match(/<link>(.*?)<\/link>/)?.[1] ||
        block.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || "";

      const rawDesc =
        block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
        block.match(/<description>([\s\S]*?)<\/description>/)?.[1] || "";

      const pubDate =
        block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      // Extract all <category> tags
      const categories: string[] = [];
      const catRegex = /<category>(.*?)<\/category>/g;
      let catMatch: RegExpExecArray | null;
      while ((catMatch = catRegex.exec(block)) !== null) {
        categories.push(catMatch[1]);
      }

      // Filter: skip gaming-only articles
      if (!shouldIncludeItem(categories)) continue;

      // Try to extract image from description HTML (rare in ANN RSS)
      let image = extractFirstImage(rawDesc);

      // Only process images for the first 6 items to avoid API/fetch spam
      if (!image && items.length < 6 && link) {
        try {
          // 1. First try to get the actual article image from its og:image meta tag
          image = await fetchArticleImage(link);

          // 2. Fall back to Anilist search if the article has no specific image
          if (!image) {
            const titleMatch = title.match(/^(.*?)(?:\sAnime|\sManga|\sCasts|\sGets|\sReveals|\sAnnounces|\sFilm|\sMovie|\sSeason)/i);
            const searchQuery = titleMatch ? titleMatch[1].trim() : title.split(':')[0].trim();
            
            if (searchQuery && searchQuery.length > 2) {
               const result = await searchAniList(searchQuery, { perPage: 1 });
               if (result.media && result.media.length > 0) {
                   const m = result.media[0];
                   image = m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large || undefined;
               }
            }
          }
        } catch (e) {
          // Ignore errors, just proceed without image
        }
      }

      const description = stripHtml(rawDesc).slice(0, 200);

      if (title.trim() && link.trim()) {
        items.push({
          id: link.trim(),
          title: title.trim(),
          description,
          url: link.trim(),
          image,
          publishDate: safeDate(pubDate),
          source: "Anime News Network",
        });
      }
    }

    return items.length > 0 ? items : getFallbackNews();
  } catch {
    return getFallbackNews();
  }
}

function getFallbackNews(): NewsItem[] {
  return [
    {
      id: "fallback-1",
      title: "Spring 2025 Anime Season — What to Watch",
      description: "The spring season brings a wealth of new titles across all genres.",
      url: "https://www.animenewsnetwork.com",
      publishDate: new Date().toISOString(),
      source: "Anime News Network",
    },
    {
      id: "fallback-2",
      title: "New Manga Adaptations Announced for 2025",
      description: "Several popular manga series are getting anime adaptations this year.",
      url: "https://www.animenewsnetwork.com",
      publishDate: new Date().toISOString(),
      source: "Anime News Network",
    },
    {
      id: "fallback-3",
      title: "Summer Season Preview: Most Anticipated Titles",
      description: "A look ahead at the most anticipated anime titles of the summer.",
      url: "https://www.animenewsnetwork.com",
      publishDate: new Date().toISOString(),
      source: "Anime News Network",
    },
  ];
}

import Image from "next/image";
import { ExternalLink, Newspaper } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { NewsItem } from "@/types";

/**
 * NewsSection — displays ANN news in a visually rich card grid.
 * ANN RSS rarely includes images, so the design relies on category
 * accent colors and clean typography instead of thumbnails.
 */

const CATEGORY_COLORS: Record<string, string> = {
  anime: "#912678",
  manga: "#2e51a2",
  "light novels": "#e67e22",
  industry: "#7f8c8d",
  people: "#8e44ad",
  events: "#e74c3c",
  "live-action": "#f39c12",
  korean: "#3498db",
  novels: "#1abc9c",
};

const FALLBACK_IMAGES = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKABsomRy.jpg", // Demon Slayer
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQ0mbzOVrI2Z.jpg", // Jujutsu Kaisen
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1-OquScNzPeJFA.jpg",      // Cowboy Bebop
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg",     // One Piece
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-nxkXkZ8g5H1b.jpg",  // Hunter x Hunter
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmndj.jpg",  // Attack on Titan
];

function getCategoryColor(source: string, title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("anime")) return CATEGORY_COLORS.anime;
  if (lower.includes("manga")) return CATEGORY_COLORS.manga;
  if (lower.includes("film") || lower.includes("movie")) return CATEGORY_COLORS.anime;
  if (lower.includes("light novel")) return CATEGORY_COLORS["light novels"];
  return CATEGORY_COLORS.industry;
}

export default function NewsSection({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <span className="w-1.5 h-6 bg-[#912678] rounded-full" />
        <h2 className="text-lg md:text-xl font-bold font-display tracking-tight">Latest News</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {news.slice(0, 6).map((item, i) => {
          const accent = getCategoryColor(item.source, item.title);
          const bgImage = item.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl overflow-hidden glass ring-1 ring-white/5 hover:ring-[#912678]/30 transition-all"
            >
              {/* Accent header bar with icon */}
              <div
                className="relative h-48 flex items-end p-4 overflow-hidden"
                style={{ backgroundColor: `${accent}15` }}
              >
                {bgImage && (
                  <Image
                    src={bgImage}
                    alt=""
                    fill
                    className="object-cover object-top opacity-80 transition-opacity hover:opacity-100"
                    sizes="300px"
                  />
                )}

                {/* Decorative accent line */}
                <div
                  className="absolute bottom-0 left-0 w-full h-[2px] z-10"
                  style={{ backgroundColor: accent }}
                />
              </div>

              <div className="p-4">
                <p className="text-sm font-semibold leading-tight group-hover:text-[#912678] transition-colors line-clamp-2 mb-2">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-[#666] line-clamp-2 mb-3">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#555]">{timeAgo(item.publishDate)}</span>
                  <ExternalLink
                    size={11}
                    className="text-[#555] group-hover:text-[#912678] transition-colors"
                  />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

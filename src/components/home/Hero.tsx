"use client";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { truncate } from "@/lib/utils";

interface HeroAnime {
  id: number;
  title: string;
  image: string;
  bannerImage?: string | null;
  synopsis?: string;
  score?: number;
  genres?: string[];
  year?: number;
  format?: string;
  episodes?: number;
}

interface HeroProps {
  items: HeroAnime[];
}

export default function Hero({ items }: HeroProps) {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(current);
  currentRef.current = current;
  const anime = items[current];

  const go = useCallback(
    (next: number) => {
      const len = items.length;
      if (len === 0) return;
      setCurrent(((next % len) + len) % len);
    },
    [items.length]
  );

  useEffect(() => {
    if (items.length < 2) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      stop();
      id = setInterval(() => go(currentRef.current + 1), 12000);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [go, items.length]);

  if (!anime) return null;

  return (
    <section className="pt-16 md:pt-20 px-3 md:px-6 ml-0 md:ml-14">
      <div className="relative h-[40vh] md:h-[55vh] min-h-[280px] md:min-h-[380px] max-h-[520px] rounded-2xl md:rounded-3xl overflow-hidden bg-[#080808]">
        {/* Single active backdrop — keep memory pressure low. */}
        <div key={anime.id} className="absolute inset-0 fade-in">
          <Image
            src={anime.bannerImage || anime.image}
            alt={anime.title}
            fill
            priority={current === 0}
            loading={current === 0 ? "eager" : "lazy"}
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 90vw"
            quality={65}
          />
        </div>

        {/* Gradients */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#080808]" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end pb-8 md:items-center md:pb-0">
          <div className="px-4 md:px-8 max-w-2xl">
            <div key={`txt-${anime.id}`} className="fade-in">
              {anime.genres && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {anime.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10 font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="font-display font-black text-xl md:text-5xl lg:text-6xl leading-none tracking-tight mb-2 md:mb-3 text-white drop-shadow-2xl">
                {anime.title}
              </h1>

              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm">
                {anime.score && (
                  <div className="flex items-center gap-1.5">
                    <Star size={14} fill="#912678" className="text-[#912678]" />
                    <span className="font-bold text-white">{anime.score.toFixed(1)}</span>
                  </div>
                )}
                {anime.year && <span className="text-white/60">{anime.year}</span>}
                {anime.format && <span className="text-white/60">{anime.format.toUpperCase()}</span>}
                {anime.episodes && <span className="text-white/60">{anime.episodes} eps</span>}
              </div>

              {anime.synopsis && (
                <p className="hidden md:block text-white/70 text-sm leading-relaxed mb-4 md:mb-6 max-w-lg">
                  {truncate(anime.synopsis.replace(/<[^>]*>/g, ""), 140)}
                </p>
              )}

              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href={`/watch/${anime.id}/1`}
                  className="btn-press flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-[#912678] text-white font-bold font-display rounded-full accent-glow hover:bg-[#a33089] text-sm md:text-base"
                >
                  <Play size={14} fill="white" />
                  Watch Now
                </Link>
                <Link
                  href={`/anime/${anime.id}`}
                  className="btn-press flex items-center gap-1.5 md:gap-2 px-3.5 md:px-5 py-2 md:py-2.5 border border-white/20 text-white font-semibold font-display rounded-full hover:bg-white/10 text-sm md:text-base"
                >
                  <Info size={14} />
                  More Info
                </Link>
              </div>
            </div>
          </div>
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-4 right-6 hidden md:flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all ${
                  i === current ? "w-6 h-2 bg-[#912678]" : "w-2 h-2 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            <div className="flex gap-1 ml-3">
              <button
                onClick={() => go(current - 1)}
                className="p-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white/70"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => go(current + 1)}
                className="p-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-white/70"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

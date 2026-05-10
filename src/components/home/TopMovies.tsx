"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface MovieItem {
  id: number;
  title: string;
  image: string;
  bannerImage?: string | null;
  score?: number;
  year?: number;
}

export default function TopMovies({ movies }: { movies: MovieItem[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => el.removeEventListener("scroll", updateScrollState);
  }, []);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 400, behavior: "smooth" });
  };

  if (!movies.length) return null;

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-[#912678] rounded-full" />
          <h2 className="text-xl font-bold font-display tracking-tight">Top Movies</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-[#555] disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            className="p-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-[#555] disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-4 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide"
        >
          {movies.map((movie, i) => (
            <Link
              key={movie.id}
              href={`/anime/${movie.id}`}
              className="flex-shrink-0 w-[280px] sm:w-[320px] group cursor-pointer"
              onMouseEnter={() => setHoveredId(movie.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative h-[160px] sm:h-[180px] rounded-lg overflow-hidden bg-white/5">
                <Image
                  src={movie.bannerImage || movie.image}
                  alt={movie.title}
                  fill
                  loading="lazy"
                  className={`object-cover transition-all duration-500 ${
                    hoveredId === movie.id ? "" : "grayscale"
                  }`}
                  sizes="320px"
                  quality={85}
                />
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    hoveredId === movie.id ? "opacity-0" : "opacity-100"
                  }`}
                  style={{
                    background:
                      "linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.5) 50%, rgba(8,8,8,0.2) 100%)",
                  }}
                />
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    opacity: hoveredId === movie.id ? 1 : 0,
                    background:
                      "linear-gradient(to top, rgba(8,8,8,0.85) 0%, rgba(8,8,8,0.2) 40%, transparent 100%)",
                  }}
                />

                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
                  <span className="text-xs font-black font-display text-[#912678]">
                    #{i + 1}
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-1 group-hover:text-[#912678] transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    {movie.score && (
                      <div className="flex items-center gap-1">
                        <Star size={10} fill="#912678" className="text-[#912678]" />
                        <span className="font-bold text-[#912678]">{movie.score.toFixed(1)}</span>
                      </div>
                    )}
                    {movie.year && <span className="text-white/50">{movie.year}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

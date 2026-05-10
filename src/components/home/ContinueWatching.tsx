"use client";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";

export default function ContinueWatching() {
  const user = useAppStore((s) => s.user);
  const getWatchHistory = useAppStore((s) => s.getWatchHistory);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  // Only show continue watching for logged-in users
  if (!user) return null;

  const recent = getWatchHistory().slice(0, 6);
  if (recent.length === 0) return null;

  return (
    <section className="relative z-10 ml-0 md:ml-20 px-3 md:px-6 mt-6 md:mt-8 mb-8 md:mb-12 fade-in">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-1.5 h-6 bg-[#912678] rounded-full" />
        <h2 className="text-xl font-bold font-display tracking-tight text-white/80">Continue Watching</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recent.map((item) => {
          const pct = (item.progress / item.duration) * 100;
          return (
            <Link
              key={`${item.animeId}-${item.episodeNumber}`}
              href={`/watch/${item.animeId}/${item.episodeNumber}`}
              className="relative w-40 flex-shrink-0 group cursor-pointer"
            >
              <div className="relative aspect-video rounded overflow-hidden bg-white/5 ring-1 ring-white/5">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  loading="lazy"
                  sizes="160px"
                  quality={60}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-[#912678] flex items-center justify-center">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
                  <div
                    className="h-full bg-[#912678] transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-1.5">
                <p className="text-xs font-medium truncate">{item.title}</p>
                <p className="text-xs text-[#555]">Ep {item.episodeNumber}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

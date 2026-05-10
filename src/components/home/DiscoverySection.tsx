"use client";
import { useState } from "react";
import AnimeCard from "@/components/ui/AnimeCard";

type Tab = "airing" | "popular" | "favorites";

interface AnimeItem {
  id: number;
  title: string;
  image: string;
  score?: number;
  episodes?: number;
  format?: string;
  synopsis?: string;
  year?: number;
}

interface DiscoverySectionProps {
  airing: AnimeItem[];
  popular: AnimeItem[];
  favorites: AnimeItem[];
}

const TABS: { key: Tab; label: string }[] = [
  { key: "airing", label: "Top Airing" },
  { key: "popular", label: "Most Popular" },
  { key: "favorites", label: "Favourites" },
];

export default function DiscoverySection({ airing, popular, favorites }: DiscoverySectionProps) {
  const [tab, setTab] = useState<Tab>("airing");

  const data = { airing, popular, favorites }[tab];

  return (
    <section>
      <div className="flex items-center gap-1 mb-4 md:mb-6 bg-white/5 rounded-lg p-1 w-fit">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-1.5 text-sm font-semibold font-display rounded-md transition-colors ${
                active ? "bg-[#912678] text-white" : "text-[#555] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        key={tab}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3 fade-in"
      >
        {data.slice(0, 15).map((anime, i) => (
          <AnimeCard key={anime.id} {...anime} index={i} />
        ))}
      </div>
    </section>
  );
}

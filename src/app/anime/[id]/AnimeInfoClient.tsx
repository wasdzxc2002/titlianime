"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  Play, Star, CalendarDays, Tv, ChevronLeft, ChevronRight,
  ExternalLink, BookOpen, Users, Trophy, Clock
} from "lucide-react";
import AnimeCard from "@/components/ui/AnimeCard";
import WalineComments from "@/components/ui/WalineComments";

interface Character {
  id: number; name: string; image: string; role: string;
  voiceActor?: { name: string; image: string };
}
interface Rec { id: number; title: string; image: string; score?: number }

interface AnimeData {
  id: number; title: string; titleJapanese?: string; image: string;
  bannerImage?: string; synopsis?: string; score?: number; episodes?: number;
  status?: string; genres?: string[]; year?: number; format?: string;
  studios?: string[]; rating?: string; source?: string;
  characters?: Character[]; recommendations?: Rec[];
  trailer?: string; rank?: number; popularity?: number; broadcast?: string;
}

export default function AnimeInfoClient({ anime }: { anime: AnimeData }) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (dir: 1 | -1) => {
    carouselRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  const statusColor =
    anime.status === "currently_airing" || anime.status === "RELEASING"
      ? "text-green-400"
      : anime.status === "not_yet_aired" || anime.status === "NOT_YET_RELEASED"
      ? "text-yellow-400"
      : "text-[#888]";

  return (
    <div className="min-h-dvh">
      {/* Immersive backdrop */}
      <div className="relative h-[280px] md:h-[520px] overflow-hidden">
        {anime.bannerImage ? (
          <Image
            src={anime.bannerImage}
            alt={anime.title}
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a1a] to-[#080808]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 to-transparent" />
      </div>

      <div className="ml-0 md:ml-20 px-3 md:px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Poster + info row */}
          <div className="-mt-32 md:-mt-48 relative z-10 flex gap-4 md:gap-8 mb-8 md:mb-10">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 hidden md:block"
            >
              <div className="w-52 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                <Image
                  src={anime.image}
                  alt={anime.title}
                  width={208}
                  height={295}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Link href={`/watch/${anime.id}/1`}>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#912678] text-white font-bold font-display rounded-lg hover:bg-[#a33089] text-sm">
                    <Play size={14} fill="white" />
                    Watch Now
                  </button>
                </Link>
                {anime.trailer && (
                  <a href={anime.trailer} target="_blank" rel="noopener noreferrer">
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 text-white/70 rounded-lg hover:bg-white/5 text-sm">
                      <ExternalLink size={14} />
                      Trailer
                    </button>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 min-w-0 pt-4 md:pt-36"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {anime.genres?.slice(0, 4).map((g) => (
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-white/60 border border-white/8">
                    {g}
                  </span>
                ))}
              </div>

              <h1 className="font-display font-black text-2xl md:text-5xl leading-tight mb-1">{anime.title}</h1>
              {anime.titleJapanese && (
                <p className="text-[#555] text-base mb-4 font-display">{anime.titleJapanese}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
                {anime.score && (
                  <div className="flex items-center gap-1.5">
                    <Star size={14} fill="#912678" className="text-[#912678]" />
                    <span className="font-bold text-[#912678]">{anime.score.toFixed(1)}</span>
                    <span className="text-[#555]">/ 10</span>
                  </div>
                )}
                {anime.status && (
                  <span className={`font-semibold capitalize ${statusColor}`}>
                    {anime.status.replace(/_/g, " ")}
                  </span>
                )}
                {anime.format && (
                  <div className="flex items-center gap-1 text-[#888]">
                    <Tv size={13} />
                    {anime.format.toUpperCase()}
                  </div>
                )}
                {anime.episodes && (
                  <div className="flex items-center gap-1 text-[#888]">
                    <BookOpen size={13} />
                    {anime.episodes} eps
                  </div>
                )}
                {anime.year && (
                  <div className="flex items-center gap-1 text-[#888]">
                    <CalendarDays size={13} />
                    {anime.year}
                  </div>
                )}
              </div>

              {/* Mobile: Watch Now + Trailer above description */}
              <div className="flex items-center gap-2.5 mb-4 md:hidden">
                <Link href={`/watch/${anime.id}/1`}>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#912678] text-white font-bold font-display rounded-lg hover:bg-[#a33089] text-sm">
                    <Play size={14} fill="white" />
                    Watch Now
                  </button>
                </Link>
                {anime.trailer && (
                  <a href={anime.trailer} target="_blank" rel="noopener noreferrer">
                    <button className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/70 rounded-lg hover:bg-white/5 text-sm">
                      <ExternalLink size={14} />
                      Trailer
                    </button>
                  </a>
                )}
              </div>

              {anime.synopsis && (
                <p className="text-white/70 text-sm leading-relaxed max-w-2xl line-clamp-5 mb-5">
                  {anime.synopsis}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {anime.rank != null && (
                  <div className="glass rounded-lg p-3 text-center">
                    <Trophy size={16} className="text-[#912678] mx-auto mb-1" />
                    <div className="text-lg font-black font-display">#{anime.rank}</div>
                    <div className="text-xs text-[#555]">Ranked</div>
                  </div>
                )}
                {anime.popularity != null && (
                  <div className="glass rounded-lg p-3 text-center">
                    <Users size={16} className="text-[#912678] mx-auto mb-1" />
                    <div className="text-lg font-black font-display">#{anime.popularity}</div>
                    <div className="text-xs text-[#555]">Popularity</div>
                  </div>
                )}
                {anime.studios?.[0] && (
                  <div className="glass rounded-lg p-3 text-center">
                    <Tv size={16} className="text-[#912678] mx-auto mb-1" />
                    <div className="text-sm font-bold truncate">{anime.studios[0]}</div>
                    <div className="text-xs text-[#555]">Studio</div>
                  </div>
                )}
                {anime.broadcast && (
                  <div className="glass rounded-lg p-3 text-center">
                    <Clock size={16} className="text-[#912678] mx-auto mb-1" />
                    <div className="text-xs font-bold capitalize">{anime.broadcast}</div>
                    <div className="text-xs text-[#555]">Broadcast</div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Characters Carousel */}
          {anime.characters && anime.characters.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold font-display">Characters & Voice Actors</h2>
                <div className="flex gap-1">
                  <button onClick={() => scrollCarousel(-1)} className="p-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-[#555]">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => scrollCarousel(1)} className="p-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-[#555]">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div ref={carouselRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {anime.characters.map((char, i) => (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex-shrink-0 w-36 text-center"
                  >
                    <div className="relative w-20 h-20 mx-auto mb-2">
                      <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-white/10">
                        <Image src={char.image || "/placeholder.jpg"} alt={char.name} width={80} height={80} className="w-full h-full object-cover" />
                      </div>
                      {char.voiceActor && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#080808]">
                          <Image src={char.voiceActor.image || "/placeholder.jpg"} alt={char.voiceActor.name} width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold leading-tight">{char.name}</p>
                    <p className="text-[10px] text-[#555] capitalize">{char.role.toLowerCase()}</p>
                    {char.voiceActor && (
                      <p className="text-[10px] text-[#444] mt-0.5">{char.voiceActor.name}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {anime.recommendations && anime.recommendations.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-bold font-display mb-5">Recommended for You</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {anime.recommendations.map((rec, i) => (
                  <div key={rec.id} className="flex-shrink-0 w-36">
                    <AnimeCard {...rec} index={i} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comments */}
          <section className="mb-16">
            <h2 className="text-lg font-bold font-display mb-5">Community Discussion</h2>
            <div className="glass rounded-xl p-6 min-h-48">
              <WalineComments path={`/anime/${anime.id}`} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

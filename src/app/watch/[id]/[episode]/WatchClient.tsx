"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, List, X, ToggleLeft, ToggleRight,
  Loader2, Info
} from "lucide-react";
import VideoPlayer from "@/components/watch/VideoPlayer";
import WalineComments from "@/components/ui/WalineComments";
import { useAppStore } from "@/store";
import { syncEpisodeProgress } from "@/lib/sync";
import type { PlayableSource, PlayableSubtitle, Provider, Category } from "@/lib/miruro";

interface ClientEpisode {
  number: number;
  slug: string;
  title?: string;
  image?: string;
  filler?: boolean;
}

interface WatchClientProps {
  animeId: number;
  provider: Provider | null;
  availableProviders: Provider[];
  defaultCategory: Category;
  subEpisodes: ClientEpisode[];
  dubEpisodes: ClientEpisode[];
  episodeNum: number;
  animeTitle: string;
  animeImage: string;
  malId?: number;
  totalEpisodes?: number;
}


export default function WatchClient({
  animeId,
  provider: initialProvider,
  availableProviders,
  defaultCategory,
  subEpisodes,
  dubEpisodes,
  episodeNum,
  animeTitle,
  animeImage,
  malId,
  totalEpisodes,
}: WatchClientProps) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const { updateWatchProgress } = useAppStore();

  const [provider, setProvider] = useState<Provider | null>(initialProvider);
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [sources, setSources] = useState<PlayableSource[]>([]);
  const [subtitles, setSubtitles] = useState<PlayableSubtitle[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [skipFiller, setSkipFiller] = useState(false);
  const [episodeDrawer, setEpisodeDrawer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const episodes = category === "dub" ? dubEpisodes : subEpisodes;
  const currentEp = useMemo(
    () => episodes.find((e) => e.number === episodeNum) || episodes[episodeNum - 1],
    [episodes, episodeNum]
  );
  const prevEp = episodes.find((e) => e.number === episodeNum - 1);
  const nextEp = episodes.find((e) => e.number === episodeNum + 1);
  const nextNonFillerEp = useMemo(() => {
    const idx = episodes.findIndex((e) => e.number === episodeNum);
    if (idx === -1) return null;
    for (let i = idx + 1; i < episodes.length; i++) {
      if (!episodes[i].filler) return episodes[i];
    }
    return null;
  }, [episodes, episodeNum]);

  const subAvailable = subEpisodes.length > 0;
  const dubAvailable = dubEpisodes.length > 0;

  const loadPlayback = useCallback(
    async (p: Provider, cat: Category, slug: string) => {
      setLoadingSources(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/sources?provider=${p}&anilistId=${animeId}&category=${cat}&slug=${encodeURIComponent(slug)}`
        );
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.sources) || data.sources.length === 0) {
          setError(
            "No playable sources found. Try switching between sub and dub."
          );
          setSources([]);
          setSubtitles([]);
        } else {
          setSources(data.sources);
          setSubtitles(data.subtitles || []);
        }
      } catch {
        setError("Failed to fetch sources.");
        setSources([]);
        setSubtitles([]);
      } finally {
        setLoadingSources(false);
      }
    },
    [animeId]
  );

  useEffect(() => {
    if (!provider) {
      setError("This anime isn't available on any provider yet.");
      setLoadingSources(false);
      return;
    }
    if (!currentEp) {
      setError(`Episode ${episodeNum} isn't available in ${category}.`);
      setLoadingSources(false);
      return;
    }
    loadPlayback(provider, category, currentEp.slug);
  }, [provider, category, currentEp, episodeNum, loadPlayback]);

  // Auto-skip filler: if current ep is filler and toggle is on, jump to next non-filler
  useEffect(() => {
    if (skipFiller && currentEp?.filler && nextNonFillerEp) {
      router.replace(`/watch/${animeId}/${nextNonFillerEp.number}`);
    }
  }, [skipFiller, currentEp, nextNonFillerEp, animeId, router]);

  // Sync to MAL/AniList when episode loads (marks current + all prior eps as watched)
  const syncedRef = useRef<string>("");
  useEffect(() => {
    const syncKey = `${animeId}-${episodeNum}`;
    if (!user || syncedRef.current === syncKey) return;
    syncedRef.current = syncKey;

    syncEpisodeProgress({
      provider: user.provider,
      accessToken: user.accessToken,
      anilistId: animeId,
      malId,
      episodesWatched: episodeNum,
      totalEpisodes,
    });
  }, [user, animeId, episodeNum, malId, totalEpisodes]);

  const lastSaveRef = useRef(0);
  const handleProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!duration) return;
      const now = Date.now();
      if (now - lastSaveRef.current < 5000) return;
      lastSaveRef.current = now;
      updateWatchProgress({
        animeId,
        episodeId: currentEp?.slug || "",
        episodeNumber: episodeNum,
        progress: currentTime,
        duration,
        timestamp: now,
        title: animeTitle,
        image: animeImage,
      });
    },
    [animeId, currentEp, episodeNum, animeTitle, animeImage, updateWatchProgress]
  );

  const handleEnded = useCallback(() => {
    if (user) {
      syncEpisodeProgress({
        provider: user.provider,
        accessToken: user.accessToken,
        anilistId: animeId,
        malId,
        episodesWatched: episodeNum,
        totalEpisodes,
      });
    }

    if (autoPlay) {
      const target = skipFiller ? (nextNonFillerEp || nextEp) : nextEp;
      if (target) router.push(`/watch/${animeId}/${target.number}`);
    }
  }, [autoPlay, skipFiller, nextEp, nextNonFillerEp, router, animeId, user, malId, episodeNum, totalEpisodes]);

  const episodeListItems = (onClickEp?: () => void) =>
    episodes.map((ep) => (
      <Link key={ep.slug} href={`/watch/${animeId}/${ep.number}`}>
        <div
          className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
            ep.number === episodeNum
              ? "bg-[#912678]/15 ring-1 ring-[#912678]/30"
              : ep.filler
              ? "bg-red-500/8 hover:bg-red-500/15"
              : "hover:bg-white/5"
          }`}
          onClick={onClickEp}
        >
          {ep.image ? (
            <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-white/5">
              <Image src={ep.image} alt={`Episode ${ep.number}`} width={64} height={40} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-16 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-[#555]">{ep.number}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${ep.number === episodeNum ? "text-[#912678]" : ""}`}>
              Episode {ep.number}
              {ep.filler && <span className="ml-1.5 text-[9px] font-bold uppercase text-red-400/80">Filler</span>}
            </p>
            {ep.title && <p className="text-[10px] text-[#555] truncate">{ep.title}</p>}
          </div>
        </div>
      </Link>
    ));

  return (
    <div className="min-h-dvh bg-[#050505] pt-16 md:pt-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex gap-6">
          {/* Left column: player + controls + comments */}
          <div className="flex-1 min-w-0">
            {/* Back link */}
            <div className="mb-3">
              <Link href={`/anime/${animeId}`}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-sm text-white/60 hover:text-white transition-colors">
                  <Info size={14} />
                  {animeTitle}
                </span>
              </Link>
            </div>

            {/* Player */}
            <div className="rounded-xl overflow-hidden">
              {loadingSources ? (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-[#912678] animate-spin" />
                    <p className="text-sm text-[#555]">Loading video sources…</p>
                  </div>
                </div>
              ) : error ? (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  <div className="text-center px-8">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              ) : sources.length > 0 ? (
                <VideoPlayer
                  sources={sources}
                  subtitles={subtitles}
                  title={animeTitle}
                  episodeNum={episodeNum}
                  onProgress={handleProgress}
                  onEnded={handleEnded}
                  autoPlay={autoPlay}
                />
              ) : null}
            </div>

            {/* Controls bar */}
            <div className="py-4">
              {/* Nav row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  {prevEp && (
                    <Link href={`/watch/${animeId}/${prevEp.number}`}>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs md:text-sm text-[#888] hover:text-white">
                        <ChevronLeft size={14} />
                        Ep {prevEp.number}
                      </button>
                    </Link>
                  )}
                  <span className="text-xs md:text-sm font-semibold font-display px-1 md:px-2 truncate">
                    {animeTitle} <span className="text-[#912678]">· Ep {episodeNum}</span>
                  </span>
                  {nextEp && (
                    <Link href={`/watch/${animeId}/${nextEp.number}`}>
                      <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs md:text-sm text-[#888] hover:text-white">
                        Ep {nextEp.number}
                        <ChevronRight size={14} />
                      </button>
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => setEpisodeDrawer(true)}
                  className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-[#888] hover:text-white"
                >
                  <List size={14} />
                  Episodes
                </button>
              </div>

              {/* Settings row */}
              <div className="flex flex-wrap items-center gap-4 py-3 border-y border-white/5 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-[#666]">Auto Play</span>
                  <button onClick={() => setAutoPlay(!autoPlay)} className="text-[#912678]">
                    {autoPlay ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-[#444]" />}
                  </button>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-[#666]">Skip Filler</span>
                  <button onClick={() => setSkipFiller(!skipFiller)} className="text-[#912678]">
                    {skipFiller ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-[#444]" />}
                  </button>
                </label>

                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                  {(["sub", "dub"] as const).map((t) => {
                    const enabled = t === "sub" ? subAvailable : dubAvailable;
                    return (
                      <button
                        key={t}
                        onClick={() => enabled && setCategory(t)}
                        disabled={!enabled}
                        className={`px-3 py-1 rounded text-xs font-bold font-display uppercase transition-colors ${
                          category === t
                            ? "bg-[#912678] text-white"
                            : enabled
                            ? "text-[#555] hover:text-white"
                            : "text-[#333] cursor-not-allowed"
                        }`}
                        title={enabled ? "" : `${t.toUpperCase()} not available on this provider`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Comments */}
              <div className="mb-8">
                <h3 className="text-sm font-bold font-display mb-4 text-white/60">Comments</h3>
                <div className="glass rounded-xl p-5">
                  <WalineComments path={`/watch/${animeId}/${episodeNum}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: episode list (desktop) */}
          <div className="hidden lg:flex w-80 flex-shrink-0 flex-col rounded-xl border border-white/5 bg-white/[0.02] max-h-[calc(100dvh-6rem)] sticky top-20">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-bold font-display text-sm">Episodes</h3>
              <span className="text-xs text-[#555]">{episodes.length} eps</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {episodeListItems()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile episode drawer (< lg) */}
      <AnimatePresence>
        {episodeDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEpisodeDrawer(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 w-80 glass-heavy border-l border-white/8 z-50 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-bold font-display text-sm">Episodes</h3>
                <button onClick={() => setEpisodeDrawer(false)} className="text-[#555] hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {episodeListItems(() => setEpisodeDrawer(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Play, History, LogIn } from "lucide-react";
import { useAppStore } from "@/store";
import { formatTime } from "@/lib/utils";

export default function HistoryPage() {
  const user = useAppStore((s) => s.user);
  const getWatchHistory = useAppStore((s) => s.getWatchHistory);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const setAuthModalOpen = useAppStore((s) => s.setAuthModalOpen);

  const watchHistory = getWatchHistory();

  // Not logged in — show login prompt
  if (!user) {
    return (
      <div className="ml-0 md:ml-20 px-3 md:px-6 pt-18 md:pt-24 pb-12 md:pb-16">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <History size={20} className="text-[#912678]" />
            <h1 className="text-2xl md:text-3xl font-black font-display">Watch History</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-[#912678]/10 flex items-center justify-center mb-6">
              <LogIn size={36} className="text-[#912678]" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">Sign in to track history</h2>
            <p className="text-[#555] text-sm mb-6 max-w-sm">
              Log in with MAL or AniList to save your watch history and sync your progress across devices.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 bg-[#912678] text-white font-bold font-display rounded hover:bg-[#a33089] transition-colors flex items-center gap-2"
            >
              <LogIn size={16} />
              Sign In
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-20 px-3 md:px-6 pt-18 md:pt-24 pb-12 md:pb-16">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <History size={20} className="text-[#912678]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black font-display">Watch History</h1>
              <p className="text-sm text-[#555] mt-0.5">{watchHistory.length} episodes watched</p>
            </div>
          </div>
          {watchHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[#555] hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={14} />
              Clear History
            </button>
          )}
        </div>

        {watchHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <History size={36} className="text-[#333]" />
            </div>
            <h2 className="text-xl font-bold font-display mb-2">No watch history yet</h2>
            <p className="text-[#555] text-sm mb-6 max-w-xs">
              Start watching anime and your history will appear here
            </p>
            <Link href="/">
              <button className="px-6 py-3 bg-[#912678] text-white font-bold font-display rounded hover:bg-[#a33089] transition-colors flex items-center gap-2">
                <Play size={16} fill="white" />
                Browse Anime
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {watchHistory.map((item, i) => {
                const pct = Math.min((item.progress / item.duration) * 100, 100);
                return (
                  <motion.div
                    key={`${item.animeId}-${item.episodeId}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ delay: i * 0.03 }}
                    className="group"
                  >
                    <Link href={`/watch/${item.animeId}/${item.episodeNumber}`}>
                      <div className="relative aspect-[2/3] rounded overflow-hidden bg-white/5 mb-2">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#912678] flex items-center justify-center">
                            <Play size={14} fill="white" className="ml-0.5 text-white" />
                          </div>
                        </div>
                        {/* Progress */}
                        <div className="absolute bottom-0 left-0 right-0">
                          <div className="h-[3px] bg-white/20">
                            <div
                              className="h-full bg-[#912678] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        {/* Ep badge */}
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
                          <span className="text-[10px] font-bold text-[#912678]">EP {item.episodeNumber}</span>
                        </div>
                      </div>
                    </Link>
                    <p className="text-xs font-semibold line-clamp-2 mb-0.5">{item.title}</p>
                    <p className="text-[10px] text-[#555]">
                      {formatTime(item.progress)} / {formatTime(item.duration)}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

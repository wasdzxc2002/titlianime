"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Filter, X, RotateCcw, SlidersHorizontal } from "lucide-react";
import AnimeCard from "@/components/ui/AnimeCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { SearchFilters } from "@/types";

interface AnimeResult {
  id: number;
  title: string;
  image: string;
  score?: number;
  episodes?: number;
  format?: string;
  synopsis?: string;
  year?: number;
  genres?: string[];
}

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Thriller",
  "Supernatural", "Mecha", "Music", "Psychological",
];

const FORMATS = ["TV", "Movie", "OVA", "ONA", "Special"];
const STATUSES = ["Airing", "Finished", "Upcoming"];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

export default function ExplorePage() {
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);

  const fetchResults = useCallback(async (currentFilters: SearchFilters, currentPage: number, reset = false) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.query) params.set("q", currentFilters.query);
      if (currentFilters.genre) params.set("genre", currentFilters.genre);
      if (currentFilters.format) params.set("format", currentFilters.format);
      if (currentFilters.status) params.set("status", currentFilters.status);
      if (currentFilters.year) params.set("year", String(currentFilters.year));
      params.set("page", String(currentPage));

      const res = await fetch(`/api/explore?${params}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error("fetch error");
      const data = await res.json() as { results: AnimeResult[]; hasMore: boolean };
      setResults((prev) => reset ? data.results : [...prev, ...data.results]);
      setHasMore(data.hasMore);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always fetch on mount to fix client-side navigation showing empty page
    setPage(1);
    setResults([]);
    fetchResults(filters, 1, true);
    mountedRef.current = true;
  }, []);

  useEffect(() => {
    // React to filter changes (skip the initial mount — handled above)
    if (!mountedRef.current) return;
    setPage(1);
    setResults([]);
    fetchResults(filters, 1, true);
  }, [filters, fetchResults]);

  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
          setPage((p) => {
            const next = p + 1;
            fetchResults(filtersRef.current, next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchResults]);

  const resetFilters = () => setFilters({});
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="ml-0 md:ml-20 px-3 md:px-6 pt-18 md:pt-24 pb-12 md:pb-16">
      <div className="max-w-[1400px] mx-auto">
        {/* Sticky filter bar */}
        <div className="sticky top-14 md:top-16 z-20 -mx-3 md:-mx-6 px-3 md:px-6 py-3 glass-heavy border-b border-white/5 mb-4 md:mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterOpen || activeFilterCount > 0
                  ? "bg-[#912678] text-white"
                  : "bg-white/5 hover:bg-white/10 text-[#888]"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick genre chips */}
            <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide">
              {GENRES.slice(0, 8).map((g) => (
                <button
                  key={g}
                  onClick={() => setFilters((f) => ({ ...f, genre: f.genre === g ? undefined : g }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    filters.genre === g
                      ? "bg-[#912678] text-white"
                      : "bg-white/5 hover:bg-white/10 text-[#888]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-[#555] hover:text-white transition-colors"
              >
                <RotateCcw size={12} />
                Reset
              </button>
            )}
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  {/* Format */}
                  <div>
                    <label className="text-xs text-[#555] mb-1.5 block font-medium">Format</label>
                    <select
                      value={filters.format || ""}
                      onChange={(e) => setFilters((f) => ({ ...f, format: (e.target.value as SearchFilters["format"]) || undefined }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#912678]/50 text-white appearance-none"
                    >
                      <option value="">All Formats</option>
                      {FORMATS.map((f) => <option key={f} value={f.toLowerCase()}>{f}</option>)}
                    </select>
                  </div>
                  {/* Status */}
                  <div>
                    <label className="text-xs text-[#555] mb-1.5 block font-medium">Status</label>
                    <select
                      value={filters.status || ""}
                      onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#912678]/50 text-white appearance-none"
                    >
                      <option value="">All Status</option>
                      {STATUSES.map((s) => <option key={s} value={s.toUpperCase()}>{s}</option>)}
                    </select>
                  </div>
                  {/* Year */}
                  <div>
                    <label className="text-xs text-[#555] mb-1.5 block font-medium">Year</label>
                    <select
                      value={filters.year || ""}
                      onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#912678]/50 text-white appearance-none"
                    >
                      <option value="">All Years</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  {/* Genre */}
                  <div>
                    <label className="text-xs text-[#555] mb-1.5 block font-medium">Genre</label>
                    <select
                      value={filters.genre || ""}
                      onChange={(e) => setFilters((f) => ({ ...f, genre: e.target.value || undefined }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#912678]/50 text-white appearance-none"
                    >
                      <option value="">All Genres</option>
                      {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-[#555]">
            {results.length > 0 ? `${results.length}+ results` : ""}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3 mb-8">
          {results.map((anime, i) => (
            <AnimeCard key={`${anime.id}-${i}`} {...anime} index={i % 20} />
          ))}
          {loading &&
            Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={`sk-${i}`} />
            ))}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="h-8" />

        {!hasMore && results.length > 0 && (
          <p className="text-center text-sm text-[#555] py-8">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}

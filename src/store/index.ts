"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, WatchProgress, AnimeStatus } from "@/types";

interface WatchlistEntry {
  animeId: number;
  status: AnimeStatus;
  progress: number;
  score?: number;
}

/**
 * Per-user watch history map.
 * Key = user id (e.g. "mal-12345" or "anilist-67890").
 * Value = array of WatchProgress entries for that user.
 */
type UserHistoryMap = Record<string, WatchProgress[]>;

interface AppState {
  user: User | null;
  /** Per-user watch histories keyed by "provider-id" */
  userHistories: UserHistoryMap;
  watchlist: WatchlistEntry[];
  authModalOpen: boolean;
  searchQuery: string;

  setUser: (user: User | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  updateWatchProgress: (progress: WatchProgress) => void;
  updateWatchlistEntry: (entry: WatchlistEntry) => void;
  getWatchProgress: (animeId: number, episodeId: string) => WatchProgress | undefined;
  clearHistory: () => void;
  /** Computed: returns the current user's watch history (empty if logged out) */
  getWatchHistory: () => WatchProgress[];
}

function userKey(user: User | null): string | null {
  return user ? `${user.provider}-${user.id}` : null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userHistories: {},
      watchlist: [],
      authModalOpen: false,
      searchQuery: "",

      setUser: (user) => set({ user }),
      setAuthModalOpen: (open) => set({ authModalOpen: open }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      updateWatchProgress: (progress) =>
        set((state) => {
          const key = userKey(state.user);
          // Don't save history if not logged in
          if (!key) return {};

          const history = [...(state.userHistories[key] || [])];
          // Deduplicate by animeId — only keep the latest episode per anime
          const existing = history.findIndex(
            (p) => p.animeId === progress.animeId
          );
          if (existing >= 0) {
            // Remove old entry and put updated one at the front
            history.splice(existing, 1);
          }
          history.unshift(progress);
          // Cap at 200 entries per user
          if (history.length > 200) history.length = 200;
          return {
            userHistories: { ...state.userHistories, [key]: history },
          };
        }),

      updateWatchlistEntry: (entry) =>
        set((state) => {
          const existing = state.watchlist.findIndex((e) => e.animeId === entry.animeId);
          if (existing >= 0) {
            const updated = [...state.watchlist];
            updated[existing] = entry;
            return { watchlist: updated };
          }
          return { watchlist: [entry, ...state.watchlist] };
        }),

      getWatchProgress: (animeId, episodeId) => {
        const state = get();
        const key = userKey(state.user);
        if (!key) return undefined;
        return (state.userHistories[key] || []).find(
          (p) => p.animeId === animeId && p.episodeId === episodeId
        );
      },

      clearHistory: () =>
        set((state) => {
          const key = userKey(state.user);
          if (!key) return {};
          const { [key]: _, ...rest } = state.userHistories;
          return { userHistories: rest };
        }),

      getWatchHistory: () => {
        const state = get();
        const key = userKey(state.user);
        if (!key) return [];
        return state.userHistories[key] || [];
      },
    }),
    {
      name: "titlianime-store",
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (!state) return state;

        // v0 → v1: move old flat watchHistory into userHistories
        if (state.watchHistory && Array.isArray(state.watchHistory) && state.watchHistory.length > 0) {
          const histories = (state.userHistories || {}) as UserHistoryMap;
          if (!histories["legacy"]) {
            histories["legacy"] = state.watchHistory as WatchProgress[];
          }
          state.userHistories = histories;
          delete state.watchHistory;
        }

        // v1 → v2: deduplicate per-anime (keep only latest episode per animeId)
        if (version < 2 && state.userHistories) {
          const histories = state.userHistories as UserHistoryMap;
          for (const key of Object.keys(histories)) {
            const seen = new Set<number>();
            histories[key] = histories[key].filter((entry) => {
              if (seen.has(entry.animeId)) return false;
              seen.add(entry.animeId);
              return true;
            });
          }
          state.userHistories = histories;
        }

        return state;
      },
      version: 2,
    }
  )
);

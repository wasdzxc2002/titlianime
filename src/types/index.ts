export interface AnimeBasic {
  id: number;
  title: string;
  image: string;
  score?: number;
  episodes?: number;
  status?: string;
  genres?: string[];
  year?: number;
  season?: string;
  format?: string;
}

export interface AnimeDetail extends AnimeBasic {
  titleJapanese?: string;
  synopsis?: string;
  trailer?: string;
  background?: string;
  coverImage?: string;
  characters?: Character[];
  staff?: StaffMember[];
  recommendations?: AnimeBasic[];
  studios?: string[];
  source?: string;
  rating?: string;
  duration?: string;
  premiered?: string;
  broadcast?: string;
  producers?: string[];
  licensors?: string[];
  type?: string;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  malId?: number;
  anilistId?: number;
}

export interface Character {
  id: number;
  name: string;
  image: string;
  role: string;
  voiceActor?: {
    name: string;
    image: string;
  };
}

export interface StaffMember {
  id: number;
  name: string;
  image: string;
  role: string;
}

export interface Episode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  description?: string;
  airDate?: string;
  duration?: number;
  isFiller?: boolean;
  isRecap?: boolean;
}

export interface StreamSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface ScheduleEntry {
  id: number;
  title: string;
  image: string;
  episode: number;
  airTime: string;
  airDate: string;
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: string;
  publishDate: string;
  source: string;
}

export interface WatchProgress {
  animeId: number;
  episodeId: string;
  episodeNumber: number;
  progress: number;
  duration: number;
  timestamp: number;
  title: string;
  image: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  provider: "mal" | "anilist";
  accessToken: string;
}

export type AnimeStatus = "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";
export type AnimeSeason = "winter" | "spring" | "summer" | "fall";
export type AnimeFormat = "tv" | "movie" | "ova" | "ona" | "special" | "music";

export interface SearchFilters {
  query?: string;
  genre?: string;
  status?: string;
  format?: AnimeFormat;
  year?: number;
  season?: AnimeSeason;
  sort?: string;
  page?: number;
}

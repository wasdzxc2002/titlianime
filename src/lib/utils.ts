export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatScore(score: number | undefined): string {
  if (!score) return "N/A";
  return score.toFixed(1);
}

export function formatEpisodes(eps: number | undefined): string {
  if (!eps) return "? eps";
  return `${eps} eps`;
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trimEnd() + "…";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function getCurrentSeason(): { season: string; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const season =
    month >= 1 && month <= 3 ? "winter" :
    month >= 4 && month <= 6 ? "spring" :
    month >= 7 && month <= 9 ? "summer" : "fall";
  return { season, year };
}

export function getSeasonColor(season: string): string {
  const colors: Record<string, string> = {
    winter: "#60a5fa",
    spring: "#86efac",
    summer: "#fbbf24",
    fall: "#fb923c",
  };
  return colors[season] ?? "#888";
}

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Clock, Star } from "lucide-react";

interface AnimeItem {
  id: number;
  title: string;
  image: string;
  score?: number;
  year?: number;
  format?: string;
}

export default function SidePanels({
  completed,
  upcoming,
}: {
  completed: AnimeItem[];
  upcoming: AnimeItem[];
}) {
  return (
    <aside className="space-y-6">
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={14} className="text-[#912678]" />
          <h3 className="text-sm font-bold font-display text-white/80">Latest Completed</h3>
        </div>
        <div className="space-y-0.5">
          {completed.slice(0, 7).map((anime) => (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-white/5">
                <Image
                  src={anime.image}
                  alt={anime.title}
                  width={32}
                  height={44}
                  className="w-full h-full object-cover"
                  quality={55}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:text-[#912678] transition-colors">
                  {anime.title}
                </p>
                <p className="text-[10px] text-[#555] mt-0.5">
                  {anime.format?.toUpperCase()} {anime.year ? `· ${anime.year}` : ""}
                </p>
              </div>
              {anime.score && (
                <div className="flex items-center gap-0.5">
                  <Star size={8} fill="#912678" className="text-[#912678]" />
                  <span className="text-[10px] text-[#912678] font-bold">
                    {anime.score.toFixed(1)}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
        <Link
          href="/explore?status=FINISHED"
          className="block text-center text-xs text-[#912678] hover:text-[#b44d9e] transition-colors mt-3 font-medium"
        >
          View More →
        </Link>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-[#912678]" />
          <h3 className="text-sm font-bold font-display text-white/80">Top Upcoming</h3>
        </div>
        <div className="space-y-0.5">
          {upcoming.slice(0, 7).map((anime, i) => (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <span className="text-[10px] font-bold text-[#555] w-4 text-right flex-shrink-0">
                {i + 1}
              </span>
              <div className="w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-white/5">
                <Image
                  src={anime.image}
                  alt={anime.title}
                  width={32}
                  height={44}
                  className="w-full h-full object-cover"
                  quality={55}
                />
              </div>
              <p className="text-xs font-medium truncate group-hover:text-[#912678] transition-colors flex-1 min-w-0">
                {anime.title}
              </p>
            </Link>
          ))}
        </div>
        <Link
          href="/schedule"
          className="block text-center text-xs text-[#912678] hover:text-[#b44d9e] transition-colors mt-3 font-medium"
        >
          Full Schedule →
        </Link>
      </div>
    </aside>
  );
}

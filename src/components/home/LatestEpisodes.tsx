import Image from "next/image";
import Link from "next/link";
import { Play, Clock } from "lucide-react";

interface LatestEp {
  id: string;
  animeId: number;
  title: string;
  image: string;
  episodeNumber: number;
}

export default function LatestEpisodes({ episodes }: { episodes: LatestEp[] }) {
  if (!episodes.length) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-5">
        <Clock size={16} className="text-[#912678]" />
        <h2 className="text-lg font-bold font-display">Latest Episodes</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {episodes.slice(0, 8).map((ep) => (
          <Link
            key={ep.id}
            href={`/watch/${ep.animeId}/${ep.episodeNumber}`}
            className="group cursor-pointer block"
          >
            <div className="relative aspect-video overflow-hidden rounded bg-white/5 ring-1 ring-white/5">
              <Image
                src={ep.image}
                alt={ep.title}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
                quality={75}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#912678]/90 flex items-center justify-center">
                  <Play size={16} fill="white" className="text-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-semibold leading-tight truncate drop-shadow">
                  {ep.title}
                </p>
                <p className="text-white/60 text-[10px] mt-0.5">Episode {ep.episodeNumber}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

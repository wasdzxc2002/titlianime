import Image from "next/image";
import Link from "next/link";
import { Star, Play } from "lucide-react";
import { truncate } from "@/lib/utils";

interface AnimeCardProps {
  id: number;
  title: string;
  image: string;
  score?: number;
  episodes?: number;
  format?: string;
  synopsis?: string;
  year?: number;
  index?: number;
  variant?: "default" | "compact" | "wide" | "featured";
}

export default function AnimeCard({
  id,
  title,
  image,
  score,
  episodes,
  format,
  synopsis,
  year,
  variant = "default",
}: AnimeCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/anime/${id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
      >
        <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-white/5">
          <Image
            src={image}
            alt={title}
            width={40}
            height={56}
            className="w-full h-full object-cover"
            quality={75}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate group-hover:text-[#912678] transition-colors">
            {title}
          </div>
          <div className="text-xs text-[#555] mt-0.5">
            {format?.toUpperCase()} {year ? `· ${year}` : ""}
          </div>
        </div>
        {score && (
          <div className="flex items-center gap-1 text-xs text-[#912678] flex-shrink-0">
            <Star size={10} fill="#912678" />
            {score.toFixed(1)}
          </div>
        )}
      </Link>
    );
  }

  if (variant === "wide") {
    return (
      <Link href={`/anime/${id}`} className="flex gap-3 group cursor-pointer">
        <div className="relative w-16 h-22 rounded overflow-hidden flex-shrink-0 bg-white/5">
          <Image src={image} alt={title} fill className="object-cover" sizes="64px" quality={60} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={16} fill="white" className="text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-sm font-semibold leading-tight group-hover:text-[#912678] transition-colors line-clamp-2">
            {title}
          </div>
          <div className="text-xs text-[#555] mt-1.5 space-x-2">
            {format && <span>{format.toUpperCase()}</span>}
            {episodes && <span>· {episodes} eps</span>}
          </div>
          {score && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star size={10} fill="#912678" className="text-[#912678]" />
              <span className="text-xs text-[#912678] font-semibold">{score.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/anime/${id}`} className="group cursor-pointer block">
      <div className="relative aspect-[2/3] rounded overflow-hidden bg-white/5 ring-1 ring-white/5">
        <Image
          src={image}
          alt={title}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 200px"
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#912678] rounded text-white text-xs font-semibold font-display">
              <Play size={10} fill="white" />
              Watch
            </span>
          </div>
          {synopsis && (
            <p className="text-xs text-white/80 leading-relaxed line-clamp-3">
              {truncate(synopsis.replace(/<[^>]*>/g, ""), 100)}
            </p>
          )}
        </div>
        {score && (
          <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 rounded px-1.5 py-0.5">
            <Star size={9} fill="#912678" className="text-[#912678]" />
            <span className="text-xs font-bold text-white">{score.toFixed(1)}</span>
          </div>
        )}
        {format && format.toLowerCase() !== "tv" && (
          <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-[#912678] uppercase">{format}</span>
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-[#912678] transition-colors">
          {title}
        </h3>
        <div className="text-xs text-[#555]">
          {year && <span>{year}</span>}
          {episodes && <span> · {episodes} eps</span>}
        </div>
      </div>
    </Link>
  );
}

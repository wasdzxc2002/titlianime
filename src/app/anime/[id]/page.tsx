import { getAniListById } from "@/lib/anilist";
import { getAnimeById, malToBasic } from "@/lib/mal";
import AnimeInfoClient from "./AnimeInfoClient";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const anilist = await getAniListById(parseInt(id));
    return { title: anilist.title.english || anilist.title.romaji };
  } catch {
    return { title: "Anime Info" };
  }
}

export default async function AnimeInfoPage({ params }: Props) {
  const { id } = await params;
  const anilistId = parseInt(id);

  let anilistData = null;
  let malData = null;

  try { anilistData = await getAniListById(anilistId); } catch { /* skip */ }

  if (anilistData?.idMal) {
    try { malData = await getAnimeById(anilistData.idMal); } catch { /* skip */ }
  }

  const malBasic = malData ? malToBasic(malData) : null;

  const anime = {
    id: anilistId,
    title: anilistData?.title.english || anilistData?.title.romaji || malBasic?.title || "Unknown",
    titleJapanese: anilistData?.title.native || malData?.alternative_titles?.ja || "",
    image: anilistData?.coverImage.extraLarge || anilistData?.coverImage.large || malBasic?.image || "/placeholder.jpg",
    bannerImage: anilistData?.bannerImage || malBasic?.image || "",
    synopsis: (anilistData?.description || malBasic?.synopsis || "").replace(/<[^>]*>/g, ""),
    score: malBasic?.score || (anilistData?.averageScore ? anilistData.averageScore / 10 : undefined),
    episodes: anilistData?.episodes || malBasic?.episodes,
    status: anilistData?.status || malBasic?.status,
    genres: anilistData?.genres || malBasic?.genres || [],
    year: anilistData?.seasonYear || malBasic?.year,
    format: anilistData?.format?.toLowerCase() || malBasic?.format,
    studios: anilistData?.studios?.nodes.map((s) => s.name) || malData?.studios?.map((s) => s.name) || [],
    rating: malBasic?.rating,
    source: anilistData?.source || malData?.source,
    characters: anilistData?.characters?.edges.map((e) => ({
      id: e.node.id,
      name: e.node.name.full,
      image: e.node.image.large || "",
      role: e.role,
      voiceActor: e.voiceActors[0]
        ? { name: e.voiceActors[0].name.full, image: e.voiceActors[0].image.large || "" }
        : undefined,
    })) || [],
    recommendations: anilistData?.recommendations?.nodes
      .filter((n) => n.mediaRecommendation)
      .map((n) => ({
        id: n.mediaRecommendation.id,
        title: n.mediaRecommendation.title.english || n.mediaRecommendation.title.romaji,
        image: n.mediaRecommendation.coverImage.large || n.mediaRecommendation.coverImage.medium || "",
        score: n.mediaRecommendation.averageScore
          ? n.mediaRecommendation.averageScore / 10
          : undefined,
      })) || [],
    trailer: anilistData?.trailer?.site === "youtube"
      ? `https://www.youtube.com/watch?v=${anilistData.trailer.id}`
      : undefined,
    rank: malData?.rank,
    popularity: malData?.popularity,
    broadcast: malData?.broadcast ? `${malData.broadcast.day_of_the_week} at ${malData.broadcast.start_time}` : undefined,
  };

  return <AnimeInfoClient anime={anime} />;
}

import WatchClient from "./WatchClient";
import {
  getEpisodes,
  pickProvider,
  listAvailableProviders,
  getEpisodeList,
  extractSlug,
  type Provider,
  type Category,
} from "@/lib/miruro";
import { getAniListById } from "@/lib/anilist";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string; episode: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id, episode } = await params;
    const anilist = await getAniListById(parseInt(id));
    const title = anilist.title.english || anilist.title.romaji;
    return { title: `${title} - Episode ${episode}` };
  } catch {
    return { title: "Watch" };
  }
}

interface ClientEpisode {
  number: number;
  slug: string;
  title?: string;
  image?: string;
  filler?: boolean;
}

function toClientEpisodes(eps: ReturnType<typeof getEpisodeList>): ClientEpisode[] {
  return eps
    .map((ep) => {
      const slug = extractSlug(ep.id);
      if (!slug) return null;
      return { number: ep.number, slug, title: ep.title, image: ep.image, filler: ep.filler };
    })
    .filter((x): x is ClientEpisode => x !== null);
}

export default async function WatchPage({ params }: Props) {
  const { id, episode } = await params;
  const anilistId = parseInt(id);
  const epNum = parseInt(episode);

  let animeTitle = "Unknown Anime";
  let animeImage = "";
  let malId: number | undefined;
  let totalEpisodes: number | undefined;

  try {
    const anilist = await getAniListById(anilistId);
    animeTitle = anilist.title.english || anilist.title.romaji || animeTitle;
    animeImage =
      anilist.coverImage.extraLarge ||
      anilist.coverImage.large ||
      anilist.coverImage.medium ||
      "";
    malId = anilist.idMal ?? undefined;
    totalEpisodes = anilist.episodes ?? undefined;
  } catch {
    /* AniList unreachable — keep defaults */
  }

  let provider: Provider | null = null;
  let category: Category = "sub";
  let availableProviders: Provider[] = [];
  let subEpisodes: ClientEpisode[] = [];
  let dubEpisodes: ClientEpisode[] = [];

  try {
    const data = await getEpisodes(anilistId);
    availableProviders = listAvailableProviders(data);
    provider = pickProvider(data, "sub") || pickProvider(data, "dub");
    if (provider) {
      subEpisodes = toClientEpisodes(getEpisodeList(data, provider, "sub"));
      dubEpisodes = toClientEpisodes(getEpisodeList(data, provider, "dub"));
      // If only dub exists, default to dub
      if (subEpisodes.length === 0 && dubEpisodes.length > 0) category = "dub";
    }
  } catch {
    /* Miruro unreachable */
  }

  return (
    <WatchClient
      animeId={anilistId}
      provider={provider}
      availableProviders={availableProviders}
      defaultCategory={category}
      subEpisodes={subEpisodes}
      dubEpisodes={dubEpisodes}
      episodeNum={epNum}
      animeTitle={animeTitle}
      animeImage={animeImage}
      malId={malId}
      totalEpisodes={totalEpisodes}
    />
  );
}

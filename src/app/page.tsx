import { Suspense } from "react";
import Hero from "@/components/home/Hero";
import ContinueWatching from "@/components/home/ContinueWatching";
import DiscoverySection from "@/components/home/DiscoverySection";
import SidePanels from "@/components/home/SidePanels";
import NewsSection from "@/components/home/NewsSection";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { getTrending, getPopular, getUpcoming, getTopMovies, anilistToBasic } from "@/lib/anilist";
import { getANNNews } from "@/lib/ann";
import TopMovies from "@/components/home/TopMovies";

export const revalidate = 600;

async function HeroBlock() {
  let trending: ReturnType<typeof anilistToBasic>[] = [];
  try {
    const raw = await getTrending(1, 10);
    trending = raw.map(anilistToBasic);
  } catch {
    /* skip */
  }
  const withBanner = trending.filter((a) => a.image && a.synopsis && a.bannerImage);
  const withoutBanner = trending.filter((a) => a.image && a.synopsis && !a.bannerImage);
  const heroItems = [...withBanner, ...withoutBanner].slice(0, 5);
  return <Hero items={heroItems} />;
}

async function DiscoveryBlock() {
  const [trendingResult, popularResult, upcomingResult] = await Promise.allSettled([
    getTrending(1, 15),
    getPopular(1, 15),
    getUpcoming(1, 10),
  ]);

  const trending = trendingResult.status === "fulfilled" ? trendingResult.value.map(anilistToBasic) : [];
  const popular = popularResult.status === "fulfilled" ? popularResult.value.map(anilistToBasic) : [];
  const upcoming = upcomingResult.status === "fulfilled" ? upcomingResult.value.map(anilistToBasic) : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 md:gap-8 mb-10 md:mb-14">
      <div>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <span className="w-1.5 h-6 bg-[#912678] rounded-full" />
          <h2 className="text-lg md:text-xl font-bold font-display tracking-tight">Discover Anime</h2>
        </div>
        <DiscoverySection airing={trending} popular={popular} favorites={popular.slice(6)} />
      </div>
      <SidePanels completed={trending.slice(6)} upcoming={upcoming.slice(0, 7)} />
    </div>
  );
}

async function TopMoviesBlock() {
  let movies: ReturnType<typeof anilistToBasic>[] = [];
  try {
    const raw = await getTopMovies(1, 10);
    movies = raw.map(anilistToBasic);
  } catch {
    /* skip */
  }
  if (movies.length === 0) return null;
  return <TopMovies movies={movies} />;
}

async function NewsBlock() {
  let newsItems: Awaited<ReturnType<typeof getANNNews>> = [];
  try {
    newsItems = await getANNNews(6);
  } catch {
    /* skip */
  }
  if (newsItems.length === 0) return null;
  return <NewsSection news={newsItems} />;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="pt-16 md:pt-20 px-3 md:px-6 ml-0 md:ml-14"><div className="h-[40vh] md:h-[55vh] min-h-[280px] md:min-h-[380px] max-h-[520px] rounded-2xl md:rounded-3xl bg-[#0a0a0a]" /></div>}>
        <HeroBlock />
      </Suspense>

      <ContinueWatching />

      <div className="ml-0 md:ml-20 px-3 md:px-6 pb-12 md:pb-16">
        <div className="max-w-[1400px] mx-auto">
          <Suspense
            fallback={
              <div className="mb-14">
                <SkeletonRow count={6} />
              </div>
            }
          >
            <DiscoveryBlock />
          </Suspense>

          <Suspense fallback={<div className="h-48" />}>
            <TopMoviesBlock />
          </Suspense>

          <Suspense fallback={<div className="h-48" />}>
            <NewsBlock />
          </Suspense>
        </div>
      </div>
    </>
  );
}

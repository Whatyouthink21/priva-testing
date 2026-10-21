import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import ContinueCard from '../components/ContinueCard';
import RankedRow from '../components/RankedRow';
import ContentRow from '../components/ContentRow';
import StudiosRow from '../components/StudiosRow';
import GenresRow from '../components/GenresRow';
import LanguagesRow from '../components/LanguagesRow';
import { api, normalizeItem, prepareHeroSlides } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';

let cachedHomeSnapshot = null;

export default function Home() {
  const { continueWatching, recentSeeds, removeWatchProgress } = useLibrary();
  const { toast } = useToast();

  const [heroLoading, setHeroLoading] = useState(!cachedHomeSnapshot);
  const [rowsLoading, setRowsLoading] = useState(!cachedHomeSnapshot);
  const [heroSlides, setHeroSlides] = useState(() => cachedHomeSnapshot?.heroSlides || []);
  const [trending, setTrending] = useState(() => cachedHomeSnapshot?.trending || []);
  const [newMovies, setNewMovies] = useState(() => cachedHomeSnapshot?.newMovies || []);
  const [popularTv, setPopularTv] = useState(() => cachedHomeSnapshot?.popularTv || []);
  const [popularAnime, setPopularAnime] = useState(() => cachedHomeSnapshot?.popularAnime || []);
  const [topMovies, setTopMovies] = useState(() => cachedHomeSnapshot?.topMovies || []);
  const [becauseItems, setBecauseItems] = useState([]);

  useEffect(() => {
    document.title = 'Priva — Stream Movies, Shows & Anime';
    if (cachedHomeSnapshot) {
      setHeroLoading(false);
      setRowsLoading(false);
      return undefined;
    }

    let cancelled = false;

    async function load() {
      try {
        // Stage 1: Fetch hero + top 10 first for instant paint
        const trendRes = await api.trendingAll(1);
        if (cancelled) return;

        const trendClean = (trendRes.results || []).filter((x) => x.media_type !== 'person');
        const slides = prepareHeroSlides(trendClean, 'movie', 10);
        const trendNorm = trendClean.map((x) => normalizeItem(x));

        setHeroSlides(slides);
        setTrending(trendNorm);
        setHeroLoading(false);

        // Stage 2: Load shelves independently with Promise.allSettled
        const [nowRes, tvRes, animeRes, topRes] = await Promise.allSettled([
          api.nowPlayingMovies(1),
          api.popularTv(1),
          api.animeSeries(1),
          api.topRatedMovies(1),
        ]);
        if (cancelled) return;

        const nextNewMovies =
          nowRes.status === 'fulfilled'
            ? (nowRes.value.results || []).map((x) => normalizeItem(x, 'movie'))
            : [];
        const nextPopularTv =
          tvRes.status === 'fulfilled'
            ? (tvRes.value.results || []).map((x) => normalizeItem(x, 'tv'))
            : [];
        const nextPopularAnime =
          animeRes.status === 'fulfilled'
            ? (animeRes.value.results || []).map((x) =>
                normalizeItem({ ...x, isAnime: true }, 'tv')
              )
            : [];
        const nextTopMovies =
          topRes.status === 'fulfilled'
            ? (topRes.value.results || []).map((x) => normalizeItem(x, 'movie'))
            : [];

        setNewMovies(nextNewMovies);
        setPopularTv(nextPopularTv);
        setPopularAnime(nextPopularAnime);
        setTopMovies(nextTopMovies);

        cachedHomeSnapshot = {
          heroSlides: slides,
          trending: trendNorm,
          newMovies: nextNewMovies,
          popularTv: nextPopularTv,
          popularAnime: nextPopularAnime,
          topMovies: nextTopMovies,
        };
      } catch {
        setHeroLoading(false);
      } finally {
        if (!cancelled) {
          setHeroLoading(false);
          setRowsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const primarySeed = recentSeeds[0];
  useEffect(() => {
    if (!primarySeed?.id) {
      setBecauseItems([]);
      return undefined;
    }
    let cancelled = false;
    api
      .recommendationsFor(primarySeed.type || 'movie', primarySeed.id)
      .then((res) => {
        if (!cancelled) setBecauseItems(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [primarySeed?.id, primarySeed?.type]);

  return (
    <div className="min-h-screen bg-[#0f1014]">
      <HeroBanner slides={heroSlides} loading={heroLoading} />

      <div className="relative z-20 -mt-6 space-y-2">
        {continueWatching.length > 0 && (
          <section className="py-4">
            <div className="mb-3.5 flex items-center justify-between px-4 sm:px-8 lg:pl-[108px] lg:pr-12">
              <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-white sm:text-[21px]">
                Continue Watching
              </h2>
              <Link
                to="/space"
                className="inline-flex items-center gap-0.5 text-[13.5px] font-semibold text-[#8f98b2] transition-colors hover:text-white"
              >
                <span>View All</span>
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:px-8 lg:pl-[108px] lg:pr-12">
              {continueWatching.map((entry) => (
                <ContinueCard
                  key={`${entry.type}-${entry.id}`}
                  entry={entry}
                  onRemove={(item) => {
                    removeWatchProgress(item);
                    toast(`Removed "${item.title}" from Continue Watching`, 'info');
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <RankedRow
          title="Trending Right Now"
          items={trending}
          loading={heroLoading}
          viewAllTo="/category/Trending%20Right%20Now"
        />

        {primarySeed && becauseItems.length > 0 && (
          <ContentRow
            title={`Because You Watched ${primarySeed.title}`}
            items={becauseItems}
            viewAllTo="/space"
          />
        )}

        <ContentRow
          title="New Movies"
          items={newMovies}
          loading={rowsLoading}
          viewAllTo="/category/New%20Movies"
        />

        <ContentRow
          title="Popular TV Shows"
          items={popularTv}
          loading={rowsLoading}
          viewAllTo="/category/Popular%20TV%20Shows"
        />

        <ContentRow
          title="Trending Anime"
          items={popularAnime}
          loading={rowsLoading}
          viewAllTo="/category/Trending%20Anime"
        />

        <StudiosRow />
        <GenresRow />

        <ContentRow
          title="Top Rated Movies"
          items={topMovies}
          loading={rowsLoading}
          viewAllTo="/category/Top%20Rated%20Movies"
        />

        <LanguagesRow />
      </div>
    </div>
  );
}

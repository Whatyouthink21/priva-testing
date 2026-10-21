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
import { api, hydrateHeroSlides, normalizeItem } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';

export default function Home() {
  const { continueWatching, recentSeeds, removeWatchProgress } = useLibrary();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newMovies, setNewMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [becauseItems, setBecauseItems] = useState([]);

  useEffect(() => {
    document.title = 'Priva — Stream Movies, Shows & Anime';
    let cancelled = false;

    async function load() {
      try {
        const [trendRes, nowRes, tvRes, animeRes, topRes] = await Promise.all([
          api.trendingAll(1),
          api.nowPlayingMovies(1),
          api.popularTv(1),
          api.animeSeries(1),
          api.topRatedMovies(1),
        ]);

        if (cancelled) return;

        const trendClean = (trendRes.results || []).filter((x) => x.media_type !== 'person');
        const slides = await hydrateHeroSlides(trendClean, 'movie', 10);
        if (cancelled) return;

        setHeroSlides(slides);
        setTrending(trendClean.map((x) => normalizeItem(x)));
        setNewMovies((nowRes.results || []).map((x) => normalizeItem(x, 'movie')));
        setPopularTv((tvRes.results || []).map((x) => normalizeItem(x, 'tv')));
        setPopularAnime(
          (animeRes.results || []).map((x) => normalizeItem({ ...x, isAnime: true }, 'tv'))
        );
        setTopMovies((topRes.results || []).map((x) => normalizeItem(x, 'movie')));
      } catch {
        // Handled gracefully with empty shelves
      } finally {
        if (!cancelled) setLoading(false);
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
      <HeroBanner slides={heroSlides} loading={loading} />

      <div className="relative z-20 -mt-6 space-y-2">
        {/* Continue Watching Shelf (when active) */}
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

        {/* Top 10 Trending Right Now */}
        <RankedRow
          title="Trending Right Now"
          items={trending}
          loading={loading}
          viewAllTo="/category/Trending%20Right%20Now"
        />

        {/* Personalized Because You Watched Row */}
        {primarySeed && becauseItems.length > 0 && (
          <ContentRow
            title={`Because You Watched ${primarySeed.title}`}
            items={becauseItems}
            viewAllTo="/space"
          />
        )}

        {/* New Movies */}
        <ContentRow
          title="New Movies"
          items={newMovies}
          loading={loading}
          viewAllTo="/category/New%20Movies"
        />

        {/* Popular TV Shows */}
        <ContentRow
          title="Popular TV Shows"
          items={popularTv}
          loading={loading}
          viewAllTo="/category/Popular%20TV%20Shows"
        />

        {/* Popular Anime */}
        <ContentRow
          title="Trending Anime"
          items={popularAnime}
          loading={loading}
          viewAllTo="/category/Trending%20Anime"
        />

        {/* Studios */}
        <StudiosRow />

        {/* Popular Genres */}
        <GenresRow />

        {/* Top Rated Movies */}
        <ContentRow
          title="Top Rated Movies"
          items={topMovies}
          loading={loading}
          viewAllTo="/category/Top%20Rated%20Movies"
        />

        {/* Popular Languages */}
        <LanguagesRow />
      </div>
    </div>
  );
}

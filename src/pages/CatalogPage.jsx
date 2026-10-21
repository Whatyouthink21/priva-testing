import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import RankedRow from '../components/RankedRow';
import ContentRow from '../components/ContentRow';
import PosterCard from '../components/PosterCard';
import { api, hydrateHeroSlides, normalizeItem } from '../lib/tmdb';

const CONFIGS = {
  movie: {
    pageTitle: 'Movies · Priva',
    rankedTitle: 'Trending Movies',
    rankedSlug: 'Trending Movies',
    discoverPath: '/discover/movie',
    shelves: [
      { title: 'Popular Movies', slug: 'Popular Movies', fetch: () => api.popularMovies(1) },
      { title: 'Upcoming Movies', slug: 'Upcoming Movies', fetch: () => api.upcomingMovies(1) },
      { title: 'Top Rated Movies', slug: 'Top Rated Movies', fetch: () => api.topRatedMovies(1) },
    ],
    heroFetch: () => api.trendingMovies(1),
    exploreFetch: () => api.popularMovies(2),
    fallbackType: 'movie',
    isAnime: false,
  },
  tv: {
    pageTitle: 'TV Shows · Priva',
    rankedTitle: 'Trending TV Shows',
    rankedSlug: 'Trending TV Shows',
    discoverPath: '/discover/tv',
    shelves: [
      { title: 'Popular TV Shows', slug: 'Popular TV Shows', fetch: () => api.popularTv(1) },
      { title: 'Upcoming Series', slug: 'Upcoming Series', fetch: () => api.onTheAirTv(1) },
      {
        title: 'Animation TV Shows',
        slug: 'Animation TV Shows',
        fetch: () => api.discover('tv', { with_genres: '16', page: 1 }),
      },
      { title: 'Top Rated TV Shows', slug: 'Top Rated TV Shows', fetch: () => api.topRatedTv(1) },
    ],
    heroFetch: () => api.trendingTv(1),
    exploreFetch: () => api.popularTv(2),
    fallbackType: 'tv',
    isAnime: false,
  },
  anime: {
    pageTitle: 'Anime · Priva',
    rankedTitle: 'Trending Anime',
    rankedSlug: 'Trending Anime',
    discoverPath: '/discover/anime',
    shelves: [
      {
        title: 'Top Rated Anime Series',
        slug: 'Top Rated Anime Series',
        fetch: () => api.animeTopSeries(1),
      },
      {
        title: 'Top Rated Anime Movies',
        slug: 'Top Rated Anime Movies',
        fetch: () => api.animeMovies(1),
        typeOverride: 'movie',
      },
    ],
    heroFetch: () => api.animeSeries(1),
    exploreFetch: () => api.animeSeries(2),
    fallbackType: 'tv',
    isAnime: true,
  },
};

export default function CatalogPage({ kind = 'movie' }) {
  const cfg = CONFIGS[kind] || CONFIGS.movie;
  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState([]);
  const [ranked, setRanked] = useState([]);
  const [rows, setRows] = useState([]);
  const [exploreGrid, setExploreGrid] = useState([]);

  useEffect(() => {
    document.title = cfg.pageTitle;
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [heroRes, exploreRes, ...shelfResults] = await Promise.all([
          cfg.heroFetch(),
          cfg.exploreFetch(),
          ...cfg.shelves.map((s) => s.fetch()),
        ]);

        if (cancelled) return;

        const rawHero = (heroRes.results || []).map((x) =>
          cfg.isAnime ? { ...x, isAnime: true } : x
        );
        const slides = await hydrateHeroSlides(rawHero, cfg.fallbackType, 10);
        if (cancelled) return;

        setHeroSlides(slides);
        setRanked(rawHero.map((x) => normalizeItem(x, cfg.fallbackType)));
        setRows(
          cfg.shelves.map((shelf, i) => ({
            title: shelf.title,
            slug: shelf.slug,
            items: (shelfResults[i]?.results || []).map((x) =>
              normalizeItem(
                cfg.isAnime ? { ...x, isAnime: true } : x,
                shelf.typeOverride || cfg.fallbackType
              )
            ),
          }))
        );
        setExploreGrid(
          (exploreRes.results || []).map((x) =>
            normalizeItem(cfg.isAnime ? { ...x, isAnime: true } : x, cfg.fallbackType)
          )
        );
      } catch {
        // Graceful fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return (
    <div className="min-h-screen bg-[#0f1014]">
      <HeroBanner slides={heroSlides} loading={loading} />

      <div className="relative z-20 -mt-6 space-y-2">
        <RankedRow
          title={cfg.rankedTitle}
          items={ranked}
          loading={loading}
          viewAllTo={`/category/${encodeURIComponent(cfg.rankedSlug)}`}
        />

        {rows.map((row) => (
          <ContentRow
            key={row.title}
            title={row.title}
            items={row.items}
            loading={loading}
            viewAllTo={`/category/${encodeURIComponent(row.slug)}`}
          />
        ))}

        {/* Explore Grid Section matching bottom of bingr.one/movies, /tv, /anime */}
        {exploreGrid.length > 0 && (
          <section className="px-4 pt-6 sm:px-8 lg:pl-[108px] lg:pr-12">
            <div className="mb-4 flex items-center justify-between">
              <Link
                to={cfg.discoverPath}
                className="group inline-flex items-center gap-2 font-display text-[20px] font-bold text-white hover:text-blue-400"
              >
                <Compass size={19} className="text-blue-400 transition group-hover:rotate-45" />
                <span>Explore</span>
              </Link>
              <Link
                to={cfg.discoverPath}
                className="rounded-lg bg-white/[0.08] px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-white/[0.14]"
              >
                Filter &amp; Discover
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {exploreGrid.map((item) => (
                <PosterCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

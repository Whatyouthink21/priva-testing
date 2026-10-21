import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import ApiRow from '../components/ApiRow';
import MediaCard from '../components/MediaCard';
import ProviderRow from '../components/ProviderRow';
import GenresRow from '../components/GenresRow';
import LanguagesRow from '../components/LanguagesRow';
import { api } from '../lib/tmdb';
import { slugify } from '../lib/utils';
import { useLibrary } from '../context/LibraryContext';
import { Play, X } from 'lucide-react';

export default function Home() {
  const { continueWatching, removeFromHistory } = useLibrary();

  return (
    <div className="pb-6 bg-[#09090b]">
      <HeroSlider />

      <div className="space-y-8 sm:space-y-10 pt-6">
        {continueWatching.length > 0 && (
          <section className="container-page" data-reveal>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="bingr-section-title">Continue Watching</h2>
              <Link to="/history" className="text-xs font-semibold text-white/50 hover:text-white">View All</Link>
            </div>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {continueWatching.map((item) => {
                const watchTo = '/watch/' + item.type + '/' + item.id + '-' + slugify(item.title || '') + (item.type === 'tv' ? '/' + (item.season||1) + '/' + (item.episode||1) : '') + '?server=1';
                return (
                  <div key={`${item.type}:${item.id}`} className="group relative shrink-0">
                    <MediaCard item={item} progress={item.progress} />
                    <Link
                      to={watchTo}
                      className="absolute inset-0 grid place-items-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-black">
                        <Play size={16} className="fill-black ml-0.5" />
                      </span>
                    </Link>
                    <button
                      onClick={() => removeFromHistory(item)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white/70 hover:bg-white hover:text-black"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <ApiRow
          title="Trending Right Now"
          ranked
          link="/trending"
          loader={() => api.trending('all', 'week')}
        />

        <ApiRow
          title="New Movies"
          link="/movies?sort=now_playing"
          loader={() => api.nowPlaying()}
        />

        <ApiRow
          title="Popular TV Shows"
          link="/tv?sort=popular"
          loader={() => api.popular('tv')}
        />

        <ProviderRow />

        <ApiRow
          title="Top Movies Today"
          ranked
          link="/trending?tab=movie"
          loader={() => api.trending('movie', 'day')}
        />

        <ApiRow
          title="Top Series Today"
          ranked
          link="/trending?tab=tv"
          loader={() => api.trending('tv', 'day')}
        />

        <ApiRow
          title="Anime Spotlight"
          link="/anime"
          loader={() =>
            api.discover('tv', {
              with_genres: '16',
              with_original_language: 'ja',
              sort_by: 'popularity.desc',
              'vote_count.gte': 40,
            })
          }
        />

        <GenresRow />

        <LanguagesRow />

        <section className="container-page">
          <div className="rounded-2xl bg-[#18181b] border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Join Our Community</h3>
              <p className="text-sm text-white/50 mt-1">Get updates on new servers and releases on Discord & Telegram</p>
            </div>
            <div className="flex gap-2">
              <a href="https://discord.gg/ytxEStcQzQ" target="_blank" rel="noreferrer" className="rounded-full bg-[#5865F2] px-5 py-2 text-sm font-semibold text-white">Discord</a>
              <a href="https://t.me/bingrone" target="_blank" rel="noreferrer" className="rounded-full bg-[#229ED9] px-5 py-2 text-sm font-semibold text-white">Telegram</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

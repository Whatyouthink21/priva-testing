import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import ApiRow from '../components/ApiRow';
import { SectionHeading } from '../components/Row';
import MediaCard from '../components/MediaCard';
import ProviderRow from '../components/ProviderRow';
import ProviderSpotlight from '../components/ProviderSpotlight';
import { api } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useReveal } from '../hooks/useReveal';
import { Play, X } from 'lucide-react';

const upcomingRow = (page = 1) => api.discover('movie', { sort_by: 'primary_release_date.desc', 'vote_count.gte': 50, page });
const topRatedTv = (page = 1) => api.topRated('tv', page);

export default function Home() {
  const { continueWatching, removeFromHistory } = useLibrary();
  useReveal([continueWatching.length]);

  return (
    <div className="pb-4">
      <HeroSlider />

      <div className="relative z-20 -mt-6 space-y-9 sm:space-y-12">
        {continueWatching.length > 0 && (
          <section className="container-page" data-reveal>
            <SectionHeading
              title="Continue watching"
              subtitle="Pick up exactly where you left off"
              link="/history"
            />
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:gap-4">
              {continueWatching.map((item) => (
                <div key={`${item.type}:${item.id}`} className="group relative shrink-0">
                  <MediaCard item={item} progress={item.progress} />
                  <Link
                    to={`/watch/${item.type}/${item.id}?s=${item.season || 1}&e=${item.episode || 1}`}
                    className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-black/55 opacity-0 transition duration-300 group-hover:opacity-100"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink-950 shadow-glow">
                      <Play size={19} className="translate-x-[1px] fill-ink-950" />
                    </span>
                  </Link>
                  <button
                    onClick={() => removeFromHistory(item)}
                    aria-label={`Remove ${item.title} from continue watching`}
                    title="Remove from continue watching"
                    className="absolute left-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/70 backdrop-blur transition hover:bg-rose-500/90 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <ApiRow
          title="Now playing"
          subtitle="Fresh in cinemas and new to streaming"
          link="/movies?sort=now_playing"
          loader={() => api.nowPlaying()}
        />

        <ApiRow
          title="Most viewed on Priva"
          subtitle="What the community is binging this week"
          link="/trending"
          loader={() => api.trending('movie', 'week')}
        />

        <div className="pt-2">
          <ProviderRow />
        </div>

        <ProviderSpotlight />

        <ApiRow
          title="Top movies today"
          ranked
          link="/trending?tab=movie"
          loader={() => api.trending('movie', 'day')}
        />

        <ApiRow
          title="Top series today"
          ranked
          link="/trending?tab=tv"
          loader={() => api.trending('tv', 'day')}
        />

        <ApiRow
          title="Anime spotlight"
          subtitle="The most-watched animation right now"
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

        <ApiRow
          title="Popular TV shows"
          subtitle="Long-running favourites and brand-new hits"
          link="/tv?sort=popular"
          loader={() => api.popular('tv')}
        />

        <ApiRow
          title="Netflix TV shows"
          link="/provider/8?name=Netflix"
          loader={() =>
            api.discover('tv', {
              with_watch_providers: 8,
              watch_region: 'US',
              sort_by: 'popularity.desc',
            })
          }
        />

        <ApiRow
          title="Comedy movies"
          subtitle="Because the world needs more laughing"
          link="/movies?genre=35"
          loader={() => api.discover('movie', { with_genres: 35, sort_by: 'popularity.desc' })}
        />

        <ApiRow
          title="Action movies"
          link="/movies?genre=28"
          loader={() => api.discover('movie', { with_genres: 28, sort_by: 'popularity.desc' })}
        />

        <ApiRow
          title="Korean cinema"
          subtitle="Thrillers, romance and everything in between"
          link="/movies?language=ko"
          loader={() =>
            api.discover('movie', {
              with_original_language: 'ko',
              sort_by: 'popularity.desc',
              'vote_count.gte': 30,
            })
          }
        />

        <ApiRow
          title="Mystery movies"
          link="/movies?genre=9648"
          loader={() => api.discover('movie', { with_genres: 9648, sort_by: 'popularity.desc' })}
        />

        <ApiRow
          title="War movies"
          link="/movies?genre=10752"
          loader={() => api.discover('movie', { with_genres: 10752, sort_by: 'popularity.desc' })}
        />

        <ApiRow
          title="Action & adventure series"
          link="/tv?genre=10759"
          loader={() => api.discover('tv', { with_genres: 10759, sort_by: 'popularity.desc' })}
        />

        <ApiRow
          title="Critically acclaimed"
          subtitle="Top-rated series of all time"
          link="/tv?sort=top_rated"
          loader={() => topRatedTv()}
        />

        <ApiRow
          title="Coming soon"
          subtitle="On the horizon"
          link="/movies?sort=upcoming"
          loader={() => upcomingRow()}
        />
      </div>
    </div>
  );
}

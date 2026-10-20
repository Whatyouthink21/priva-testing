import { Link } from 'react-router-dom';
import { Clock, History as HistoryIcon, Play, Trash2 } from 'lucide-react';
import { IMG } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { useReveal } from '../hooks/useReveal';
import { timeAgo } from '../lib/utils';
import MediaCard from '../components/MediaCard';
import { SectionHeading } from '../components/Row';

export default function History() {
  const { history, continueWatching, removeFromHistory, clearHistory } = useLibrary();
  const { toast } = useToast();
  useReveal([history.length]);

  const finished = history.filter((h) => h.finished || h.progress >= 97);

  return (
    <div className="container-page pb-14 pt-[104px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4" data-reveal>
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] sm:text-[40px]">
            Watch history
          </h1>
          <p className="mt-2 text-[13.5px] text-white/45">
            Resume anything you started, or tidy up what you've finished.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear your entire watch history?')) {
                clearHistory();
                toast('Watch history cleared.', 'info');
              }
            }}
            className="chip py-2 text-rose-300/80 hover:border-rose-400/40 hover:text-rose-200"
          >
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </header>

      {continueWatching.length > 0 ? (
        <section className="mb-12" data-reveal>
          <SectionHeading
            title="Continue watching"
            subtitle="Your resume points, newest first"
          />
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:gap-4">
            {continueWatching.map((item) => (
              <div key={`${item.type}:${item.id}`} className="group relative shrink-0">
                <MediaCard item={item} progress={item.progress} />
                <Link
                  to={`/watch/${item.type}/${item.id}?s=${item.season || 1}&e=${item.episode || 1}`}
                  className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-black/55 opacity-0 transition group-hover:opacity-100"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-ink-950">
                    <Play size={19} className="translate-x-[1px] fill-ink-950" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {history.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20 text-center" data-reveal>
          <HistoryIcon size={26} className="mb-3 text-white/20" />
          <p className="text-[15px] font-semibold text-white/70">Nothing watched yet</p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/35">
            Start a movie or an episode and it will appear here with your resume position.
          </p>
          <Link to="/" className="btn-primary mt-6">
            Find something to watch
          </Link>
        </div>
      ) : (
        <section data-reveal>
          <SectionHeading title="All activity" subtitle={`${history.length} titles`} />
          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={`${item.type}:${item.id}`}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-white/15 hover:bg-white/[0.045] sm:gap-4"
              >
                <Link
                  to={`/${item.type}/${item.id}`}
                  className="relative w-[92px] shrink-0 overflow-hidden rounded-lg sm:w-[120px]"
                >
                  {item.backdrop || item.poster ? (
                    <img
                      src={IMG.backdrop(item.backdrop || item.poster, 'w300')}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <span className="grid aspect-video w-full place-items-center bg-ink-800 text-[10px] text-white/30">
                      {item.title}
                    </span>
                  )}
                  {!item.finished && item.progress > 0 && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
                      <span
                        className="block h-full bg-brand-400"
                        style={{ width: `${Math.min(100, item.progress)}%` }}
                      />
                    </span>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/${item.type}/${item.id}`}
                    className="block truncate text-[13.5px] font-semibold text-white/90 hover:text-white"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-white/35">
                    <span className="uppercase tracking-wider">
                      {item.type === 'tv' ? 'Series' : 'Movie'}
                    </span>
                    {item.year && <span>{item.year}</span>}
                    {item.type === 'tv' && (
                      <span>
                        S{item.season || 1} · E{item.episode || 1}
                      </span>
                    )}
                    {item.finished ? (
                      <span className="text-emerald-400/70">Finished</span>
                    ) : (
                      <span className="text-brand-400/80">{Math.round(item.progress || 0)}%</span>
                    )}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[10.5px] text-white/25">
                    <Clock size={10} /> {timeAgo(item.updatedAt)}
                  </p>
                </div>

                <Link
                  to={`/watch/${item.type}/${item.id}?s=${item.season || 1}&e=${item.episode || 1}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.07] text-white/70 transition hover:bg-white hover:text-ink-950"
                  aria-label={`Play ${item.title}`}
                >
                  <Play size={14} className="translate-x-[1px] fill-current" />
                </Link>
                <button
                  onClick={() => removeFromHistory(item)}
                  aria-label={`Remove ${item.title}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/25 transition hover:bg-white/10 hover:text-rose-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

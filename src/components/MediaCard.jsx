import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { IMG, titleOf, yearOf, typeOf } from '../lib/tmdb';
import { cx } from '../lib/utils';
import RatingBadge from './RatingBadge';

export default function MediaCard({
  item,
  className,
  width = 'w-[150px] sm:w-[170px] lg:w-[190px]',
  progress,
  eager = false,
}) {
  const [loaded, setLoaded] = useState(false);
  const type = item.type || typeOf(item);
  const title = item.title || titleOf(item);
  const year = item.year || yearOf(item);
  const src = IMG.poster(item.poster || item.poster_path, 'w500');
  const href = `/${type}/${item.id}`;

  return (
    <Link
      to={href}
      className={cx(
        'group/card relative block shrink-0 outline-none',
        width,
        className
      )}
      aria-label={title}
    >
      <div className="relative overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5 transition-all duration-500 ease-smooth group-hover/card:-translate-y-1.5 group-hover/card:ring-white/25 group-hover/card:shadow-card group-focus-visible/card:ring-brand">
        <div className="relative aspect-[2/3] w-full">
          {src ? (
            <img
              src={src}
              alt={title}
              loading={eager ? 'eager' : 'lazy'}
              onLoad={() => setLoaded(true)}
              className={cx(
                'h-full w-full object-cover transition-all duration-700 ease-smooth group-hover/card:scale-[1.06]',
                loaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-ink-700 to-ink-850 p-3 text-center text-xs text-white/40">
              {title}
            </div>
          )}

          {/* hover sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-70 transition-opacity duration-500 group-hover/card:opacity-95" />

          <div className="absolute right-1.5 top-1.5">
            <RatingBadge value={item.rating} />
          </div>

          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-11 w-11 scale-75 place-items-center rounded-full bg-white/95 text-ink-950 opacity-0 shadow-lg transition-all duration-300 ease-smooth group-hover/card:scale-100 group-hover/card:opacity-100">
              <Play size={17} className="translate-x-[1px] fill-ink-950" />
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2.5 opacity-0 transition-all duration-300 ease-smooth group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-white text-shadow-hero">
              {title}
            </p>
            <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-wider text-white/55">
              {type === 'tv' ? 'Series' : 'Movie'} {year ? `· ${year}` : ''}
            </p>
          </div>

          {typeof progress === 'number' && progress > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
              <div
                className="h-full rounded-r-full bg-brand-400"
                style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MediaCardSkeleton({ width = 'w-[150px] sm:w-[170px] lg:w-[190px]' }) {
  return (
    <div className={cx('shrink-0', width)}>
      <div className="skeleton aspect-[2/3] w-full rounded-xl" />
    </div>
  );
}

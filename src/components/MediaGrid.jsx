import MediaCard, { MediaCardSkeleton } from './MediaCard';
import { cx } from '../lib/utils';
import { X } from 'lucide-react';

/**
 * Poster grid. When `onRemove` is supplied every card gets a remove (×)
 * button in its top-left corner — used by My List so items can be taken
 * off the list without opening the title first.
 */
export default function MediaGrid({ items = [], loading = false, empty, className, onRemove, removeLabel = 'Remove' }) {
  return (
    <div
      className={cx(
        'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        className
      )}
    >
      {loading
        ? Array.from({ length: 18 }).map((_, i) => (
            <MediaCardSkeleton key={i} width="w-full" />
          ))
        : items.map((item, i) =>
            onRemove ? (
              <div key={`${item.type || 'x'}-${item.id}-${i}`} className="group relative">
                <MediaCard item={item} width="w-full" eager={i < 6} />
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  aria-label={`${removeLabel} ${item.title || ''}`}
                  title={removeLabel}
                  className="absolute left-1.5 top-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/70 backdrop-blur transition hover:bg-rose-500/90 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <MediaCard
                key={`${item.type || 'x'}-${item.id}-${i}`}
                item={item}
                width="w-full"
                eager={i < 6}
              />
            )
          )}
      {!loading && !items.length && empty}
    </div>
  );
}

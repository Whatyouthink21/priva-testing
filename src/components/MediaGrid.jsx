import MediaCard, { MediaCardSkeleton } from './MediaCard';
import { cx } from '../lib/utils';

export default function MediaGrid({ items = [], loading = false, empty, className }) {
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
        : items.map((item, i) => (
            <MediaCard
              key={`${item.type || 'x'}-${item.id}-${i}`}
              item={item}
              width="w-full"
              eager={i < 6}
            />
          ))}
      {!loading && !items.length && empty}
    </div>
  );
}

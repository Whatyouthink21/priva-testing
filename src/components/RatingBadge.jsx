import { Star } from 'lucide-react';
import { cx } from '../lib/utils';
import { rating as fmt } from '../lib/tmdb';

export default function RatingBadge({ value, className, size = 'sm' }) {
  const shown = fmt(value);
  if (!shown) return null;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md bg-black/70 font-semibold text-white backdrop-blur-sm',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        className
      )}
    >
      <Star size={size === 'sm' ? 10 : 12} className="fill-gold text-gold" />
      {shown}
    </span>
  );
}

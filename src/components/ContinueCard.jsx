import { Link } from 'react-router-dom';
import { Play, X } from 'lucide-react';
import { IMG } from '../lib/tmdb';

function formatRemaining(timestamp = 0, duration = 0) {
  if (duration > timestamp && duration > 60) {
    const leftMin = Math.max(1, Math.round((duration - timestamp) / 60));
    if (leftMin >= 60) {
      return `${Math.floor(leftMin / 60)}h ${leftMin % 60}m left`;
    }
    return `${leftMin}m left`;
  }
  if (timestamp >= 60) {
    return `Watched ${Math.floor(timestamp / 60)}m`;
  }
  return 'In progress';
}

export default function ContinueCard({ entry, onRemove }) {
  if (!entry) return null;

  const watchUrl =
    entry.type === 'tv'
      ? `/watch/tv/${entry.id}/${entry.season || 1}/${entry.episode || 1}`
      : `/watch/movie/${entry.id}`;

  const image =
    IMG.still(entry.episodeStill || entry.backdrop, 'w500') ||
    IMG.poster(entry.poster, 'w342');

  const subtitle =
    entry.type === 'tv'
      ? `S${entry.season || 1} E${entry.episode || 1}${
          entry.episodeName ? ` · ${entry.episodeName}` : ''
        } · ${formatRemaining(entry.timestamp, entry.duration)}`
      : formatRemaining(entry.timestamp, entry.duration);

  return (
    <div className="group relative w-[256px] shrink-0 select-none sm:w-[288px]">
      <Link to={watchUrl} className="block">
        <div className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-[#16181f] ring-1 ring-white/[0.08] transition-transform duration-200 ease-out group-hover:scale-[1.03] group-hover:ring-white/25">
          {image ? (
            <img
              src={image}
              alt={entry.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-[#191c26] text-xs text-white/40">
              {entry.title}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

          <span className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[#0f1014] shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play size={15} className="translate-x-[1px] fill-current" />
          </span>

          <div className="absolute inset-x-0 bottom-0 h-[3.5px] bg-white/20">
            <div
              className="h-full bg-[#2563eb] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(5, entry.progress || 8))}%` }}
            />
          </div>
        </div>

        <div className="mt-2 px-0.5">
          <h3 className="truncate text-[14px] font-semibold text-[#e1e6f0] group-hover:text-white">
            {entry.title}
          </h3>
          <p className="mt-0.5 truncate text-[12px] font-medium text-[#8f98b2]">{subtitle}</p>
        </div>
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(entry);
          }}
          title="Remove from Continue Watching"
          aria-label={`Remove ${entry.title} from Continue Watching`}
          className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white/75 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-red-600 hover:text-white"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Film, Play, Plus, X } from 'lucide-react';
import { formatScore, IMG } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';

const POP_WIDTH = 296;

export default function PosterCard({ item, onRemove, className = '' }) {
  const navigate = useNavigate();
  const { isInList, toggleMyList, getProgress } = useLibrary();
  const { toast } = useToast();

  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState(null);
  const cardRef = useRef(null);
  const enterTimer = useRef(null);
  const leaveTimer = useRef(null);

  useEffect(() => {
    if (!hovered) return undefined;
    const close = () => setHovered(false);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [hovered]);

  useEffect(
    () => () => {
      clearTimeout(enterTimer.current);
      clearTimeout(leaveTimer.current);
    },
    []
  );

  if (!item) return null;

  const score = formatScore(item.rating);
  const badge = item.badge || (item.isAnime ? 'Anime' : item.type === 'tv' ? 'Series' : 'Movie');
  const saved = isInList(item);
  const resume = getProgress(item.type, item.id);
  const detailUrl = `/${item.type}/${item.id}`;
  const watchUrl =
    item.type === 'tv'
      ? `/watch/tv/${item.id}/${resume?.season || 1}/${resume?.episode || 1}`
      : `/watch/movie/${item.id}`;

  const openPreview = () => {
    clearTimeout(leaveTimer.current);
    clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => {
      if (typeof window === 'undefined' || window.innerWidth < 1024 || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerLeft = rect.left + rect.width / 2 - POP_WIDTH / 2;
      const clampedLeft = Math.max(
        104,
        Math.min(window.innerWidth - POP_WIDTH - 20, centerLeft)
      );
      const clampedTop = Math.max(
        16,
        Math.min(window.innerHeight - 320, rect.top - 16)
      );
      setCoords({ left: clampedLeft, top: clampedTop });
      setHovered(true);
    }, 380);
  };

  const scheduleClose = () => {
    clearTimeout(enterTimer.current);
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      setHovered(false);
    }, 90);
  };

  const keepOpen = () => {
    clearTimeout(leaveTimer.current);
  };

  const metaLine = [score, item.year, badge].filter(Boolean).join(' · ');

  return (
    <div
      ref={cardRef}
      onMouseEnter={openPreview}
      onMouseLeave={scheduleClose}
      className={`group relative select-none ${className}`}
    >
      <Link to={detailUrl} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[8px] bg-[#16181f] ring-1 ring-white/[0.06] transition-transform duration-200 ease-out group-hover:scale-[1.035] group-hover:ring-white/25">
          {item.poster ? (
            <img
              src={IMG.poster(item.poster, 'w342')}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#1c2030] to-[#12141c] p-3 text-center text-white/40">
              <Film size={24} />
              <span className="line-clamp-2 text-xs font-medium text-white/70">{item.title}</span>
            </div>
          )}

          {resume && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/60">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${Math.max(6, resume.progress)}%` }}
              />
            </div>
          )}
        </div>

        <div className="mt-2 px-0.5">
          <h3 className="truncate text-[13.5px] font-semibold text-[#e1e6f0] transition-colors group-hover:text-white">
            {item.title}
          </h3>
          <p className="mt-0.5 truncate text-[11.5px] font-medium text-[#8f98b2]">
            {metaLine}
          </p>
        </div>
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(item);
          }}
          aria-label={`Remove ${item.title}`}
          title="Remove"
          className="absolute right-2 top-2 z-30 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white/80 opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-red-600 hover:text-white"
        >
          <X size={14} />
        </button>
      )}

      {hovered &&
        coords &&
        (item.backdrop || item.poster) &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onMouseEnter={keepOpen}
            onMouseLeave={scheduleClose}
            onClick={() => {
              setHovered(false);
              navigate(detailUrl);
            }}
            role="presentation"
            style={{
              left: `${coords.left}px`,
              top: `${coords.top}px`,
              width: `${POP_WIDTH}px`,
            }}
            className="fixed z-[90] hidden cursor-pointer overflow-hidden rounded-[12px] border border-white/[0.11] bg-[#16181f] shadow-[0_24px_60px_rgba(0,0,0,0.92)] animate-pop-card lg:block"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-[#0f1014]">
              <img
                src={IMG.still(item.backdrop, 'w500') || IMG.poster(item.poster, 'w342')}
                alt={item.title}
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16181f] via-[#16181f]/20 to-transparent" />
              <h4 className="absolute bottom-2.5 left-3.5 right-3.5 line-clamp-1 font-display text-[15px] font-bold text-white drop-shadow">
                {item.title}
              </h4>
            </div>

            <div className="p-3.5 pt-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHovered(false);
                    navigate(watchUrl);
                  }}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-white text-[12.5px] font-bold text-[#0f1014] transition-colors hover:bg-white/90"
                >
                  <Play size={13} className="fill-current" />
                  <span>{resume ? 'Resume' : 'Watch Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const added = toggleMyList(item);
                    toast(
                      added
                        ? `Added "${item.title}" to My List`
                        : `Removed "${item.title}" from My List`,
                      added ? 'success' : 'info'
                    );
                  }}
                  aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-white/[0.1] text-white transition-colors hover:bg-white/[0.18]"
                >
                  {saved ? <Check size={15} /> : <Plus size={16} />}
                </button>
              </div>

              <div className="mt-2.5 text-[11.5px] font-semibold text-[#cbd5e1]">
                {metaLine}
              </div>

              {item.overview && (
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-[#8f98b2]">
                  {item.overview}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

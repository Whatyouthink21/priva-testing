import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Info, Clock, Check } from "lucide-react";
import { img } from "../lib/tmdb";
import { useList } from "../context/ListContext";
import { useWatchHistory } from "../context/WatchHistoryContext";

export default function MediaCard({ item, progress, showMeta=true, size="default", onHover }) {
  const navigate = useNavigate();
  const { isInList, toggleList } = useList();
  const { getProgress } = useWatchHistory();
  const [hovered, setHovered] = useState(false);

  const title = item.title || item.name;
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const poster = img.poster(item.poster_path, "w500") || img.backdrop(item.backdrop_path, "w780");
  const year = (item.release_date || item.first_air_date || "").slice(0,4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  // progress: could be passed directly or from storage
  const progKey = `${mediaType}:${item.id}`;
  const storedProg = getProgress(progKey);
  const pct = progress?.pct ?? storedProg?.pct ?? null;
  const timeLeft = progress?.timeLeft ?? storedProg?.timeLeft ?? null;

  const handleClick = () => {
    navigate(`/${mediaType}/${item.id}`);
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    navigate(`/watch/${mediaType}/${item.id}`);
  };

  const handlePlus = (e) => {
    e.stopPropagation();
    toggleList({ id: item.id, media_type: mediaType, title, poster_path: item.poster_path, backdrop_path: item.backdrop_path, vote_average: item.vote_average, release_date: item.release_date, first_air_date: item.first_air_date });
  };

  return (
    <div
      className={`group relative flex-shrink-0 cursor-pointer ${size==="large" ? "w-[260px] md:w-[300px]" : "w-[160px] md:w-[190px] lg:w-[210px]"}`}
      onMouseEnter={()=> { setHovered(true); onHover?.(item); }}
      onMouseLeave={()=> setHovered(false)}
      onClick={handleClick}
    >
      <div className="relative aspect-[16/9] md:aspect-[16/9] rounded-xl overflow-hidden bg-[#141414] border border-white/[0.06]">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-[#1a1a1e] flex items-center justify-center text-white/30 text-xs">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Hover overlay like screenshot 3 */}
        <div className={`absolute inset-0 p-2 flex flex-col justify-end transition-all duration-300 ${hovered ? "opacity-100" : "opacity-0 md:opacity-0"}`}>
          <div className="bg-[#0f0f0f]/95 backdrop-blur rounded-xl p-2 border border-white/10">
            <div className="flex items-center gap-2">
              <button onClick={handlePlay} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90">
                <Play size={14} className="fill-black ml-0.5" />
              </button>
              <button onClick={handlePlus} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15">
                {isInList(item.id, mediaType) ? <Check size={14} /> : <Plus size={14} />}
              </button>
              <div className="flex-1" />
              <button onClick={(e)=> { e.stopPropagation(); navigate(`/${mediaType}/${item.id}`); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Info size={14} />
              </button>
            </div>
            {pct !== null && (
              <div className="mt-2">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-white/60 mt-1">{timeLeft || `${pct}% watched`}</div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile play badge */}
        <div className="md:hidden absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
          <Play size={12} className="fill-white text-white ml-0.5" />
        </div>

        {/* Progress bar at bottom (always visible if progress) */}
        {pct !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <div className="h-full bg-white" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {showMeta && (
        <div className="mt-2 px-1">
          <div className="text-[13px] font-medium leading-tight line-clamp-1 text-white">{title}</div>
          <div className="text-[11px] text-white/50 flex items-center gap-1 mt-0.5">
            {mediaType==="tv" && item.number_of_seasons ? (
              <span>S1:E1</span>
            ) : (
              <>
                {timeLeft ? (
                  <span className="flex items-center gap-1"><Clock size={10} /> {timeLeft} left</span>
                ) : year ? (
                  <span>{year} {rating && `• ${rating}/10`}</span>
                ) : rating ? <span>{rating}/10</span> : <span className="opacity-60">—</span>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

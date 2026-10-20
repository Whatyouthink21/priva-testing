import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, Calendar, Rocket, Play, Plus, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { img, yearFromDate } from "../lib/tmdb";
import { useList } from "../context/ListContext";

export default function HeroCarousel({ items = [] }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const { toggleList, isInList } = useList();

  useEffect(()=> {
    if(!items.length) return;
    const id = setInterval(()=> setIndex(i=> (i+1)%items.length), 6000);
    return ()=> clearInterval(id);
  }, [items.length]);

  if(!items.length) {
    return <div className="h-[60vh] md:h-[72vh] bg-[#111] animate-pulse" />
  }

  const item = items[index];
  const backdrop = img.backdrop(item.backdrop_path, "original") || img.poster(item.poster_path,"original");
  const title = item.title || item.name;
  const year = yearFromDate(item.release_date || item.first_air_date);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const genreText = "Science Fiction"; // fallback; TMDB genres need mapping

  // Use actual genres if available
  const genres = item.genre_ids ? item.genre_ids.slice(0,2).map(id=> genreMap[id]||null).filter(Boolean).join(" • ") : null;

  return (
    <div className="relative w-full h-[58vh] md:h-[78vh] min-h-[420px] overflow-hidden bg-black">
      {/* Backdrop image */}
      <div className="absolute inset-0">
        <img src={backdrop} alt={title} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/90 via-[#080808]/40 to-transparent md:via-[#080808]/30" />
        <div className="absolute bottom-0 left-0 right-0 h-32 hero-gradient" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-[1600px] mx-auto px-4 md:px-10 lg:px-12 flex flex-col justify-end md:justify-center pb-10 md:pb-0 md:pt-10">
        <div className="max-w-[620px]">
          {/* Big title like HOPE - replicate style */}
          <h1 className="text-[42px] md:text-[78px] font-black tracking-[-0.04em] leading-none mb-3" style={{ textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>
            <span className="bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>
              {title?.toUpperCase()}
            </span>
          </h1>

          <div className="flex items-center gap-2 text-[13px] text-white/90 mb-3 flex-wrap">
            {rating && <span className="flex items-center gap-1 font-semibold"><Star size={14} className="fill-white text-white" /> {rating}/10</span>}
            {rating && <span className="w-1 h-1 bg-white/40 rounded-full" />}
            {year && <span className="flex items-center gap-1"><Calendar size={13} className="opacity-70" /> {year}</span>}
            <span className="w-1 h-1 bg-white/40 rounded-full" />
            <span className="flex items-center gap-1"><Rocket size={13} className="opacity-70" /> {item.genreText || genres || "Drama"}</span>
          </div>

          <p className="text-[13px] md:text-[14px] leading-relaxed text-white/80 line-clamp-3 md:line-clamp-3 max-w-[520px] mb-6">
            {item.overview || "Discover the most anticipated stories — streaming now on PRIVA."}
          </p>

          <div className="flex items-center gap-3">
            <button onClick={()=> navigate(`/watch/${mediaType}/${item.id}`)} className="h-10 px-6 rounded-full bg-white text-black font-semibold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors">
              <Play size={16} className="fill-black" /> Play
            </button>
            <div className="flex items-center gap-0 bg-white/10 backdrop-blur rounded-full border border-white/10 p-1">
              <button onClick={()=> toggleList({ id: item.id, media_type: mediaType, title, poster_path: item.poster_path, backdrop_path: item.backdrop_path, vote_average: item.vote_average })} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" title={isInList(item.id, mediaType) ? "Remove from My List" : "Add to My List"}>
                <Plus size={16} className={isInList(item.id, mediaType) ? "rotate-45" : ""} />
              </button>
              <div className="w-px h-4 bg-white/15 mx-1" />
              <button onClick={()=> navigate(`/${mediaType}/${item.id}`)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <Info size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel dots & arrows */}
      <div className="absolute bottom-6 right-4 md:right-10 flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          <button onClick={()=> setIndex(i=> (i-1+items.length)%items.length)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/15"><ChevronLeft size={16}/></button>
          <button onClick={()=> setIndex(i=> (i+1)%items.length)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/15"><ChevronRight size={16}/></button>
        </div>
        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur px-2 py-1 rounded-full">
          {items.slice(0,8).map((_,i)=> (
            <button key={i} onClick={()=> setIndex(i)} className={`transition-all rounded-full ${i===index ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

const genreMap = {
  28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Science Fiction",10770:"TV Movie",53:"Thriller",10752:"War",37:"Western",
  10759:"Action & Adventure",10762:"Kids",10763:"News",10764:"Reality",10765:"Sci-Fi & Fantasy",10766:"Soap",10767:"Talk",10768:"War & Politics"
}

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import MediaCard from "./MediaCard";

export default function MediaRow({ title, items=[], actionIcon, progressMap, onTitleClick, emptyText="No items", variant="portrait" }) {
  const scrollerRef = useRef(null);
  const scroll = (dir) => {
    const el = scrollerRef.current;
    if(!el) return;
    const amt = el.clientWidth * 0.8;
    el.scrollBy({ left: dir==="left" ? -amt : amt, behavior: "smooth" });
  };

  if(!items || items.length===0) {
    return (
      <section className="py-4">
        <div className="flex items-center justify-between mb-3 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
          <h2 className="text-[18px] md:text-[20px] font-semibold tracking-tight">{title}</h2>
        </div>
        <div className="px-4 md:px-8 max-w-[1600px] mx-auto text-sm text-white/50">{emptyText}</div>
      </section>
    )
  }

  const isLandscape = variant === "landscape";

  return (
    <section className="py-5 md:py-6">
      <div className="flex items-center justify-between mb-3 px-4 md:px-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] md:text-[19px] font-semibold tracking-tight">{title}</h2>
          {onTitleClick && <button onClick={onTitleClick} className="text-xs text-white/50 hover:text-white hidden md:inline">View all</button>}
        </div>
        <div className="flex items-center gap-2">
          {actionIcon && <button className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><Pencil size={13} className="opacity-60"/></button>}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={()=> scroll("left")} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><ChevronLeft size={14}/></button>
            <button onClick={()=> scroll("right")} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      <div className="relative max-w-[1600px] mx-auto">
        {isLandscape ? (
          <div ref={scrollerRef} className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 pb-2 snap-x snap-mandatory">
            {items.map(item=> (
              <div key={`${item.media_type || (item.title ? 'movie':'tv')}-${item.id}`} className="snap-start shrink-0">
                <MediaCard item={item} progress={progressMap?.[item.id]} variant="landscape" />
              </div>
            ))}
          </div>
        ) : (
          <div ref={scrollerRef} className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 md:px-8 pb-2 snap-x snap-mandatory">
            {items.map(item=> (
              <div key={`${item.media_type || (item.title ? 'movie':'tv')}-${item.id}`} className="snap-start shrink-0 w-[140px] md:w-[165px] lg:w-[180px]">
                <MediaCard item={item} progress={progressMap?.[item.id]} variant="portrait" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

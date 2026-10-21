import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../lib/utils';
import MediaCard, { MediaCardSkeleton } from './MediaCard';

export function SectionHeading({ title, subtitle, link, linkLabel='View All', className }) {
  return (
    <div className={cx('mb-3 flex items-center justify-between', className)}>
      <h2 className="text-[18px] font-bold tracking-tight text-white">{title}</h2>
      {link && <Link to={link} className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1">{linkLabel} <ChevronRight size={14}/></Link>}
    </div>
  );
}

export default function Row({ title, subtitle, link, items=[], loading=false, cardWidth, progressFor, eager=false, className, renderItem }) {
  const scroller=useRef(null);
  const [edges,setEdges]=useState({left:false,right:false});
  const measure=useCallback(()=>{
    const el=scroller.current; if(!el) return;
    setEdges({left:el.scrollLeft>8, right: el.scrollLeft+el.clientWidth < el.scrollWidth-8});
  },[]);
  useEffect(()=>{
    measure();
    const el=scroller.current; if(!el) return;
    el.addEventListener('scroll',measure,{passive:true});
    window.addEventListener('resize',measure);
    const t=setTimeout(measure,400);
    return ()=>{el.removeEventListener('scroll',measure); window.removeEventListener('resize',measure); clearTimeout(t)};
  },[measure, items.length, loading]);

  const scrollBy=dir=>{
    const el=scroller.current; if(!el) return;
    el.scrollBy({left: dir*Math.max(el.clientWidth*0.8,320), behavior:'smooth'});
  };

  if (!loading && !items.length) return null;
  return (
    <section className={cx('group/row relative',className)} data-reveal>
      <div className="container-page"><SectionHeading title={title} subtitle={subtitle} link={link} /></div>
      <div className="relative">
        <div ref={scroller} className="row-scroller container-page flex snap-x gap-3 overflow-x-auto pb-3 pt-1 sm:gap-4">
          {loading ? Array.from({length:8}).map((_,i)=><MediaCardSkeleton key={i} width={cardWidth}/>) :
            items.map((item,i)=> renderItem ? <div key={`${item.id}-${i}`} className="snap-start">{renderItem(item,i)}</div> :
              <div key={`${item.type||'x'}-${item.id}-${i}`} className="snap-start"><MediaCard item={item} width={cardWidth} eager={eager&&i<4} progress={progressFor?progressFor(item)?.progress:undefined} /></div>
          )}
        </div>
        {edges.left && <button onClick={()=>scrollBy(-1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white backdrop-blur hover:bg-black md:grid group-hover/row:opacity-100"><ChevronLeft size={18}/></button>}
        {edges.right && <button onClick={()=>scrollBy(1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white backdrop-blur hover:bg-black md:grid group-hover/row:opacity-100"><ChevronRight size={18}/></button>}
      </div>
    </section>
  );
}

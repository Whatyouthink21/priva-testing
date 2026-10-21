import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard';
import { SectionHeading } from './Row';
import { cx } from '../lib/utils';

export default function RankedRow({ title, link, items=[], loading=false, subtitle }) {
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
    const t=setTimeout(measure,300);
    return ()=>{el.removeEventListener('scroll',measure); window.removeEventListener('resize',measure); clearTimeout(t)};
  },[measure, items.length, loading]);
  const scrollBy=dir=>{
    const el=scroller.current; if(!el) return;
    el.scrollBy({left: dir*Math.max(el.clientWidth*0.8,320), behavior:'smooth'});
  };
  if (!loading && !items.length) return null;
  return (
    <section className="group/rank relative" data-reveal>
      <div className="container-page"><SectionHeading title={title} subtitle={subtitle} link={link} /></div>
      <div className="relative">
        <div ref={scroller} className="row-scroller container-page flex snap-x gap-0 overflow-x-auto pb-3 pt-1">
          {loading ? Array.from({length:6}).map((_,i)=><div key={i} className="flex shrink-0 items-end gap-1 pr-2"><div className="h-20 w-10 bg-white/5 rounded"/><div className="skeleton aspect-[2/3] w-[132px]"/></div>) :
            items.slice(0,10).map((item,i)=>(
              <div key={`${item.id}-${i}`} className={cx('group/item flex shrink-0 snap-start items-end', i===0?'pl-0':'-ml-5 sm:-ml-6')}>
                <span className="rank-number select-none -mr-3 sm:-mr-4 pb-2">{i+1}</span>
                <MediaCard item={item} width="w-[128px] sm:w-[148px]" className="relative z-10" eager={i<3} />
              </div>
            ))
          }
        </div>
        {edges.left && <button onClick={()=>scrollBy(-1)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white md:grid"><ChevronLeft size={18}/></button>}
        {edges.right && <button onClick={()=>scrollBy(1)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/70 p-2 text-white md:grid"><ChevronRight size={18}/></button>}
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info, Star } from 'lucide-react';
import { IMG, api, titleOf, yearOf, typeOf } from '../lib/tmdb';
import { cx, slugify } from '../lib/utils';

export default function HeroSlider() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    api.trending('all','week').then(async (data)=>{
      const picks = (data.results||[]).filter(r=>r.media_type==='movie'||r.media_type==='tv').slice(0,10);
      const enriched = await Promise.all(picks.map(async (pick)=>{
        try {
          const detail = await api.details(pick.media_type, pick.id);
          return {
            ...pick,
            type: pick.media_type,
            title: titleOf(pick),
            year: yearOf(pick),
            genres: detail?.genres?.slice(0,3).map(g=>g.name) || [],
            runtime: detail?.runtime || detail?.episode_run_time?.[0] || null,
          };
        } catch { return {...pick, type: pick.media_type, title: titleOf(pick), year: yearOf(pick), genres: []}; }
      }));
      if (alive) setItems(enriched);
    }).catch(()=>{});
    return ()=>{alive=false};
  }, []);

  useEffect(()=>{
    if (paused || items.length<2) return;
    timer.current=setTimeout(()=>setIndex(i=>(i+1)%items.length), 5000);
    return ()=>clearTimeout(timer.current);
  },[index, paused, items.length]);

  if (!items.length) {
    return (
      <section className="relative h-[64vh] min-h-[420px] bg-[#0a0a0a] animate-pulse">
        <div className="container-page absolute bottom-12">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="mt-4 h-10 w-96 bg-white/10 rounded" />
        </div>
      </section>
    );
  }

  const current = items[index];

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black"
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
    >
      <div className="relative h-[62vh] min-h-[460px] sm:h-[68vh] sm:min-h-[520px]">
        {items.map((item,i)=>(
          <div key={item.id} className={cx('absolute inset-0 transition-opacity duration-700', i===index?'opacity-100':'opacity-0')}>
            {item.backdrop_path && (
              <img src={IMG.backdrop(item.backdrop_path,'w1280')} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent sm:from-[#09090b] sm:via-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-end pb-8 sm:pb-12">
          <div className="container-page w-full">
            <div className="max-w-[640px]">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium">
                {current.vote_average>0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-black font-bold">
                    <Star size={10} className="fill-black" /> {Number(current.vote_average).toFixed(1)}
                  </span>
                )}
                <span className="text-white/70">{current.year}</span>
                {current.genres?.length>0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="text-white/70 truncate">{current.genres.join(' • ')}</span>
                  </>
                )}
                <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white/60">{current.type==='tv'?'Series':'Movie'}</span>
              </div>

              <h1 className="text-[28px] sm:text-[36px] font-black leading-none tracking-tight text-white drop-shadow-lg line-clamp-2">{current.title}</h1>
              <p className="mt-3 line-clamp-2 max-w-[560px] text-[13px] leading-relaxed text-white/70 sm:text-[14px]">{current.overview}</p>

              <div className="mt-5 flex items-center gap-3">
                <Link to={'/watch/' + current.type + '/' + current.id + '-' + slugify(current.title||'') + (current.type==='tv' ? '/1/1' : '') + '?server=1'} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-white/90">
                  <Play size={16} className="fill-black" /> Watch Now
                </Link>
                <Link to={`/${current.type}/${current.id}`} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20">
                  <Info size={16} /> Details
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 hidden sm:flex items-center gap-2 lg:right-8">
          {items.map((item,i)=>(
            <button key={item.id} onClick={()=>setIndex(i)} className={cx('relative h-[48px] w-[84px] overflow-hidden rounded-lg border-2 transition', i===index?'border-white':'border-white/20 opacity-60 hover:opacity-100')}>
              <img src={IMG.backdrop(item.backdrop_path,'w300')} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
          {items.map((_,i)=>(
            <button key={i} onClick={()=>setIndex(i)} className={cx('h-1.5 rounded-full transition-all', i===index?'w-6 bg-white':'w-1.5 bg-white/40')} />
          ))}
        </div>
      </div>
    </section>
  );
}

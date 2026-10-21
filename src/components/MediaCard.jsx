import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star } from 'lucide-react';
import { IMG, titleOf, yearOf, typeOf } from '../lib/tmdb';
import { cx } from '../lib/utils';

export default function MediaCard({ item, className, width = 'w-[148px] sm:w-[168px]', progress, eager=false }) {
  const [loaded,setLoaded]=useState(false);
  const type=item.type||typeOf(item);
  const title=item.title||titleOf(item);
  const year=item.year||yearOf(item);
  const src=IMG.poster(item.poster||item.poster_path,'w342');
  const href=`/${type}/${item.id}`;

  return (
    <Link to={href} className={cx('group/card block shrink-0',width,className)} aria-label={title}>
      <div className="relative overflow-hidden rounded-xl bg-[#18181b] ring-1 ring-white/5 transition-all duration-300 group-hover/card:ring-white/15">
        <div className="relative aspect-[2/3] w-full bg-black">
          {src ? (
            <img src={src} alt={title} loading={eager?'eager':'lazy'} onLoad={()=>setLoaded(true)} className={cx('h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.04]', loaded?'opacity-100':'opacity-0')} />
          ) : (
            <div className="grid h-full place-items-center p-4 text-center text-xs text-white/30">{title}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60" />
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur">
            <Star size={10} className="fill-yellow-400 text-yellow-400" /> {item.rating?Number(item.rating).toFixed(1):'—'}
          </div>
          <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover/card:opacity-100 bg-black/40">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-black"><Play size={14} className="fill-black ml-0.5" /></span>
          </div>
          {typeof progress==='number' && progress>0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full bg-white" style={{width:`${Math.min(100,progress)}%`}} /></div>
          )}
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="line-clamp-1 text-[12.5px] font-medium leading-tight text-white group-hover/card:text-white">{title}</p>
        <p className="text-[11px] text-white/40">{year} • {type==='tv'?'Series':'Movie'}</p>
      </div>
    </Link>
  );
}

export function MediaCardSkeleton({ width='w-[148px] sm:w-[168px]' }) {
  return <div className={cx('shrink-0',width)}><div className="skeleton aspect-[2/3] w-full" /></div>;
}

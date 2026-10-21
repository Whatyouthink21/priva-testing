import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMG, api } from '../lib/tmdb';

const FEATURED = [8,9,15,337,350,531,1899,386,283,43,520,526,34,300,73,538,151,11,99,237];
const NAMES = {
  8:'Netflix',9:'Prime Video',15:'Hulu',337:'Disney+',350:'Apple TV+',531:'Paramount+',1899:'Max',386:'Peacock',283:'Crunchyroll',43:'Nat Geo',520:'Starz',526:'AMC+',34:'MGM+',300:'Pluto',73:'Adult Swim'
};

export default function ProviderRow(){
  const [providers,setProviders]=useState([]);
  useEffect(()=>{
    let alive=true;
    api.providers('US').then(data=>{
      if(!alive) return;
      const map=new Map((data.results||[]).map(p=>[p.provider_id,p]));
      const picked=FEATURED.map(id=>map.get(id)).filter(Boolean).slice(0,10);
      setProviders(picked);
    }).catch(()=>{});
    return ()=>{alive=false};
  },[]);
  if(!providers.length) return null;
  return (
    <section className="container-page" data-reveal>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="bingr-section-title">Studios</h2>
        <Link to="/platforms" className="text-xs font-semibold text-white/50 hover:text-white">View All</Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {providers.map(p=>(
          <Link key={p.provider_id} to={`/provider/${p.provider_id}?name=${encodeURIComponent(p.provider_name)}`} className="group flex h-[64px] w-[110px] shrink-0 items-center justify-center rounded-xl bg-[#1a1a1e] border border-white/5 px-3 hover:border-white/15 hover:bg-[#202024] transition">
            {p.logo_path ? <img src={IMG.provider(p.logo_path)} alt={p.provider_name} className="max-h-8 max-w-[80px] object-contain" /> : <span className="text-xs text-white/60">{NAMES[p.provider_id]||p.provider_name}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}

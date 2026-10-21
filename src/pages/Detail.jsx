import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Clock, Download, Heart, Loader2, Play, Plus, Star } from 'lucide-react';
import { IMG, api, runtimeLabel, titleOf, yearOf } from '../lib/tmdb';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { cx, slugify, parseId } from '../lib/utils';
import Row from '../components/Row';
import DownloadModal from '../components/DownloadModal';
import Modal from '../components/Modal';

export default function Detail({ type = 'movie' }) {
  const rawId = useParams().id || '';
  const id = parseId(rawId);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isInList, toggleList, isFavorite, toggleFavorite, progressFor } = useLibrary();

  const [data, setData] = useState(null);
  const [credits, setCredits] = useState(null);
  const [videos, setVideos] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trailer, setTrailer] = useState(false);
  const [downloads, setDownloads] = useState(false);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setData(null);
    Promise.allSettled([api.details(type, id), api.credits(type, id), api.videos(type, id), api.recommendations(type, id), api.similar(type, id)])
      .then(([details, crew, vid, rec, sim]) => {
        if (!alive) return;
        if (details.status !== 'fulfilled') { setError('This title could not be loaded.'); setLoading(false); return; }
        const detail = details.value;
        setData(detail);
        setCredits(crew.status === 'fulfilled' ? crew.value : null);
        setVideos(vid.status === 'fulfilled' ? vid.value.results || [] : []);
        setRecommendations(rec.status === 'fulfilled' ? rec.value.results || [] : []);
        setSimilar(sim.status === 'fulfilled' ? sim.value.results || [] : []);
        const firstSeason = detail.seasons?.find(s=>s.season_number>0)?.season_number ?? 1;
        setSeason(firstSeason);
        setLoading(false);
      });
    return ()=>{alive=false};
  }, [type, id]);

  useEffect(() => {
    if (type !== 'tv' || !data) return;
    let alive = true; setEpisodesLoading(true);
    api.season(id, season).then(res=> alive && setEpisodes(res.episodes||[])).catch(()=> alive && setEpisodes([])).finally(()=> alive && setEpisodesLoading(false));
    return ()=>{alive=false};
  }, [type, id, season, data]);

  if (loading) {
    return <div className="container-page pt-10"><div className="skeleton h-[40vh] w-full" /><div className="skeleton h-10 w-64 mt-6" /></div>;
  }
  if (error || !data) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center pt-10 text-center">
        <div><p className="text-lg font-semibold">{error||'Title not found'}</p><button onClick={()=>navigate(-1)} className="btn-ghost mt-6"><ArrowLeft size={16}/> Go back</button></div>
      </div>
    );
  }

  const title = titleOf(data);
  const year = yearOf(data);
  const rating = Number(data.vote_average)||0;
  const slug = slugify(title);
  const resume = progressFor({ id, type });
  // watch link with slug and server param
  const watchHref = `/watch/${type}/${id}${slug?`-${slug}`:''}${type==='tv'? `/${resume?.season||season||1}/${resume?.episode||1}`:''}?server=${settings.preferredServer||1}`;

  const trailerKey = useMemo(()=>{
    const list=videos.filter(v=>v.site==='YouTube');
    const best=list.find(v=>v.type==='Trailer'&&v.official)||list.find(v=>v.type==='Trailer')||list.find(v=>v.type==='Teaser')||list[0];
    return best?.key||null;
  },[videos]);

  const cast = (credits?.cast||[]).slice(0,12);
  const moreLikeThis = [...recommendations, ...similar].filter((v,i,a)=>a.findIndex(t=>t.id===v.id)===i).slice(0,12).map(item=>({ ...item, type }));

  const libraryItem = data ? { id: data.id, type, title, poster: data.poster_path, backdrop: data.backdrop_path, rating: data.vote_average, year } : null;
  const inList = isInList({ id, type });
  const fav = isFavorite({ id, type });

  return (
    <div className="bg-[#09090b] pb-10">
      {/* Hero backdrop */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 h-[42vh] min-h-[320px] sm:h-[48vh]">
          {data.backdrop_path && <img src={IMG.backdrop(data.backdrop_path,'w1280')} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        </div>
        <div className="relative container-page flex flex-col items-center pt-[12vh] sm:pt-[14vh] pb-6 text-center">
          <Link to={watchHref} className="group relative mb-4 overflow-hidden rounded-xl border-2 border-white/10 shadow-xl">
            {data.poster_path ? <img src={IMG.poster(data.poster_path,'w342')} alt={title} className="h-[180px] w-[120px] object-cover sm:h-[220px] sm:w-[150px]" /> : <div className="h-[200px] w-[140px] bg-white/10 grid place-items-center text-xs">{title}</div>}
            <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 group-hover:opacity-100 transition"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-black"><Play size={18} className="fill-black ml-0.5"/></span></span>
          </Link>
          <h1 className="max-w-2xl text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
            {rating>0 && <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-bold text-black"><Star size={10} className="fill-black"/>{rating.toFixed(1)}</span>}
            {year && <span>{year}</span>}
            {data.runtime ? <span>{runtimeLabel(data.runtime)}</span> : data.episode_run_time?.[0] ? <span>{data.episode_run_time[0]}m</span> : null}
            <span className="rounded border border-white/15 px-2 py-0.5 uppercase tracking-widest text-[10px]">{data.adult?'A':data.vote_average>7?'U/A 16+':'U/A'}</span>
            {type==='tv' && data.number_of_seasons && <span>{data.number_of_seasons} Seasons</span>}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 line-clamp-3">{data.overview || 'No overview available.'}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {data.genres?.map(g=> <Link key={g.id} to={`/${type==='tv'?'tv':'movies'}?genre=${g.id}`} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/15">{g.name}</Link>)}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link to={watchHref} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-white/90">
              <Play size={16} className="fill-black"/> {resume ? 'Resume' : 'Watch Now'} <span className="hidden sm:inline text-xs font-normal opacity-60">{type}</span>
            </Link>
            {trailerKey && <button onClick={()=>setTrailer(true)} className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15">Trailer</button>}
            <button onClick={()=>setDownloads(true)} className="rounded-full bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15"><Download size={16}/></button>
            <button onClick={()=>{ const added=toggleList(libraryItem); toast(added?'Added to My List':'Removed from My List')}} className={cx('rounded-full px-4 py-2.5 text-sm font-semibold', inList?'bg-white text-black':'bg-white/10 text-white')}>
              {inList ? <Check size={16}/> : <Plus size={16}/>} {inList?'Added':'My List'}
            </button>
            <button onClick={()=>{ const added=toggleFavorite(libraryItem); toast(added?'Added to favourites':'Removed')}} className={cx('grid h-10 w-10 place-items-center rounded-full border', fav?'bg-red-500/20 border-red-500/30 text-red-400':'border-white/20 bg-white/10 text-white')}>
              <Heart size={16} className={fav?'fill-red-400':''}/>
            </button>
          </div>
        </div>
      </div>

      {/* Episodes for TV */}
      {type==='tv' && data.seasons?.length>0 && (
        <section className="container-page mt-6">
          <h2 className="bingr-section-title mb-3">Episodes</h2>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <select value={season} onChange={e=>{setSeason(Number(e.target.value)); setShowAll(false)}} className="appearance-none rounded-full bg-[#18181b] border border-white/10 px-4 py-2 pr-8 text-sm text-white">
                {data.seasons.filter(s=>s.season_number>0).map(s=> <option key={s.id} value={s.season_number} className="bg-[#18181b]">Season {s.season_number}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"/>
            </div>
          </div>
          {episodesLoading ? <div className="py-10 text-center text-white/40"><Loader2 className="mx-auto animate-spin" size={18}/></div> : (
            <div className="space-y-2">
              {(showAll?episodes:episodes.slice(0,8)).map(ep=>(
                <Link key={ep.id} to={`/watch/tv/${id}-${slug}/${season}/${ep.episode_number}`} className="flex gap-3 rounded-xl bg-[#18181b] border border-white/5 p-3 hover:border-white/10 hover:bg-[#1e1e22] transition">
                  <div className="relative w-[140px] shrink-0 overflow-hidden rounded-lg bg-black">
                    {ep.still_path ? <img src={IMG.backdrop(ep.still_path,'w300')} alt="" className="aspect-video w-full object-cover"/> : <div className="aspect-video grid place-items-center text-xs text-white/20">No Image</div>}
                    <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold">E{ep.episode_number}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{ep.episode_number}. {ep.name}</p>
                      <span className="text-xs text-white/30">{ep.runtime?`${ep.runtime}m`:''}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/40">{ep.overview||'No synopsis.'}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-black">Play <Play size={10} className="fill-black"/></span>
                  </div>
                </Link>
              ))}
              {episodes.length>8 && <button onClick={()=>setShowAll(v=>!v)} className="mx-auto flex rounded-full bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15">{showAll?'Show fewer':`Show all ${episodes.length}`}</button>}
            </div>
          )}
        </section>
      )}

      {cast.length>0 && (
        <section className="container-page mt-8">
          <h2 className="bingr-section-title mb-3">Actors</h2>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {cast.map(p=>(
              <Link key={p.id} to={`/person/${p.id}`} className="w-[110px] shrink-0">
                <div className="aspect-square overflow-hidden rounded-xl bg-[#18181b]">
                  {p.profile_path ? <img src={IMG.profile(p.profile_path,'w185')} alt={p.name} className="h-full w-full object-cover"/> : <div className="grid h-full place-items-center text-white/30 text-xs">{p.name[0]}</div>}
                </div>
                <p className="mt-1 truncate text-xs font-medium">{p.name}</p>
                <p className="truncate text-[11px] text-white/40">{p.character}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {moreLikeThis.length>0 && (
        <div className="mt-8"><Row title="Keep Binging" link={`/${type==='tv'?'tv':'movies'}`} items={moreLikeThis} /></div>
      )}

      <Modal open={trailer} onClose={()=>setTrailer(false)} className="max-w-4xl p-0">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {trailerKey && <iframe src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1`} title="trailer" allow="autoplay; encrypted-media; fullscreen" allowFullScreen className="h-full w-full"/>}
        </div>
      </Modal>
      <DownloadModal open={downloads} onClose={()=>setDownloads(false)} type={type} id={id} title={`${title}${year?` (${year})`:''}`} season={season} episode={1} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, Download, Heart, Info, Loader2, Play, Plus, RotateCcw, Sparkles, Star, X, Bookmark } from 'lucide-react';
import { IMG, api, runtimeLabel, titleOf, yearOf } from '../lib/tmdb';
import { ANIME_SERVER_ID, PLAYERS, absoluteEpisode, downloadUrl, isAnimeTitle, megaplayUrl, parseProgressMessage, playerUrl } from '../lib/sources';
import { resolveAnime } from '../lib/anime';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { cx, secondsToClock, slugify, parseId } from '../lib/utils';
import DownloadModal from '../components/DownloadModal';

export default function Watch({ type = 'movie' }) {
  const rawParams = useParams();
  const rawId = rawParams.id || '';
  const id = parseId(rawId);
  const pathSeason = rawParams.season ? Number(rawParams.season) : null;
  const pathEpisode = rawParams.episode ? Number(rawParams.episode) : null;

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, progressFor, saveProgress, isInList, toggleList } = useLibrary();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [season, setSeason] = useState(pathSeason || Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(pathEpisode || Number(searchParams.get('e')) || 1);
  const initialServer = searchParams.get('server');
  const [serverChoice, setServerChoice] = useState(() => {
    if (!initialServer) return null;
    if (initialServer === 'anime') return 'anime';
    const n = Number(initialServer);
    return Number.isFinite(n) && n>0 ? n : null;
  });
  const [animeLang, setAnimeLang] = useState('sub');
  const [animeState, setAnimeState] = useState({ status: 'idle', key: '', mapping: null });
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [startAt, setStartAt] = useState(undefined);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [downloads, setDownloads] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const saved = progressFor({ id, type });
  const savedRef = useRef(saved);
  const lastSaveRef = useRef(0);
  const seasonRef = useRef(season);
  const episodeRef = useRef(episode);
  const startedRef = useRef(new Set());
  const progressRef = useRef(null);
  const metaRef = useRef(null);
  const baseRef = useRef(0);
  const elapsedRef = useRef(0);
  const activeSrcRef = useRef(false);
  const animeToastRef = useRef(false);

  savedRef.current = saved;
  seasonRef.current = season;
  episodeRef.current = episode;

  const isAnime = isAnimeTitle(data);

  const currentEpisode = useMemo(() => episodes.find(ep => ep.episode_number === episode) || null, [episodes, episode]);

  const durationEstimate = useMemo(() => {
    if (!data) return 0;
    if (type === 'movie') return (Number(data.runtime) || 0) * 60;
    return (Number(currentEpisode?.runtime) || Number(data.episode_run_time?.[0]) || 0) * 60;
  }, [data, type, currentEpisode]);
  const durationEstimateRef = useRef(durationEstimate);
  durationEstimateRef.current = durationEstimate;

  const buildMeta = useCallback(() => {
    if (!data) return null;
    return { id, type, title: titleOf(data), poster: data.poster_path, backdrop: data.backdrop_path, rating: data.vote_average, year: yearOf(data) };
  }, [data, id, type]);
  metaRef.current = buildMeta() || metaRef.current;

  // sync season/episode from path vs query
  useEffect(() => {
    if (pathSeason && pathSeason !== season) setSeason(pathSeason);
    if (pathEpisode && pathEpisode !== episode) setEpisode(pathEpisode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathSeason, pathEpisode]);

  // server param is handled via initial state and selectServer updates

  /* Load title metadata */
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setServerChoice(null);
    setAnimeState({ status: 'idle', key: '', mapping: null });
    animeToastRef.current = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    api.details(type, id).then(res => {
      if (!alive) return;
      setData(res);
      if (type === 'tv') {
        // if path provides season/episode, respect it; else use query or resume
        const fromParams = Number(searchParams.get('s'));
        if (!pathSeason) {
          const resumeSeason = savedRef.current?.season;
          const nextSeason = (fromParams >0 && fromParams) || (resumeSeason && resumeSeason>0 ? resumeSeason : 1) || 1;
          const resumeEpisode = savedRef.current?.episode || 1;
          setSeason(nextSeason);
          setEpisode(Number(searchParams.get('e')) || resumeEpisode);
        }
      }
      setLoading(false);
    }).catch(() => {
      if (!alive) return;
      setError('This title is unavailable right now.');
      setLoading(false);
    });
    return () => { alive=false; };
  }, [type, id]);

  /* Episodes for selected season */
  useEffect(() => {
    if (type !== 'tv' || !data) return;
    let alive = true;
    setEpisodesLoading(true);
    api.season(id, season).then(res => alive && setEpisodes(res.episodes || [])).catch(()=> alive && setEpisodes([])).finally(()=> alive && setEpisodesLoading(false));
    return ()=>{alive=false};
  }, [type, id, season, data]);

  /* Keep URL in sync */
  useEffect(() => {
    if (type !== 'tv') return;
    // if we are on path style /watch/tv/:id/:season/:episode, update that path instead of query
    if (pathSeason) {
      // update path when season/episode changes
      // Only navigate if changed
      if (pathSeason !== season || pathEpisode !== episode) {
        const slug = data ? slugify(titleOf(data)) : '';
        const suffix = slug ? `-${slug}` : '';
        const serverQ = searchParams.get('server') ? `?server=${searchParams.get('server')}` : '';
        navigate(`/watch/tv/${id}${suffix}/${season}/${episode}${serverQ}`, { replace: true });
      }
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('s', String(season));
    next.set('e', String(episode));
    setSearchParams(next, { replace: true });
  }, [season, episode, type, pathSeason, pathEpisode, data, id, searchParams, setSearchParams, navigate]);

  /* Resume position */
  useEffect(() => {
    if (!saved) return;
    if (type === 'tv' && (saved.season !== season || saved.episode !== episode)) return;
    setStartAt(saved.timestamp && saved.timestamp > 30 ? saved.timestamp : undefined);
  }, [id, type, season, episode, saved]);

  const title = data ? titleOf(data) : '';
  const year = data ? yearOf(data) : '';
  const slug = title ? slugify(title) : '';

  /* Server selection */
  const preferredRaw = Number(settings.preferredServer) || 1;
  const preferredServer = PLAYERS.some(p => p.id === preferredRaw) ? preferredRaw : 1;
  const autoServer = isAnime && animeState.status !== 'failed' ? ANIME_SERVER_ID : preferredServer;
  const server = serverChoice ?? autoServer;

  useEffect(() => {
    if (!data || !isAnime) return;
    const key = `${id}:${season}`;
    if (animeState.key === key && animeState.status !== 'idle') return;
    let alive = true;
    setAnimeState({ status: 'loading', key, mapping: null });
    resolveAnime(data, { type, season }).then(mapping => {
      if (!alive) return;
      if (mapping && (mapping.anilistId || mapping.malId)) {
        setAnimeState({ status: 'ready', key, mapping });
      } else {
        setAnimeState({ status: 'failed', key, mapping: null });
        if (!animeToastRef.current) { animeToastRef.current = true; toast('Anime source not found — using regular servers.', 'info'); }
      }
    });
    return ()=>{alive=false};
  }, [data, isAnime, id, type, season]);

  const animeSrc = useMemo(() => {
    if (animeState.status !== 'ready' || !animeState.mapping) return null;
    const mapping = animeState.mapping;
    const ep = type === 'movie' ? 1 : mapping.episodeMode === 'absolute' ? absoluteEpisode(data, season, episode) : episode;
    return megaplayUrl({ anilistId: mapping.anilistId, malId: mapping.malId, episode: ep, lang: animeLang });
  }, [animeState, data, type, season, episode, animeLang]);

  const embedSrc = useMemo(() => playerUrl(typeof server === 'number' ? server : 1, type, id, { season, episode, startAt, autoplayNext: settings.autoplayNext, subtitle: settings.subtitles }), [server, type, id, season, episode, startAt, settings.autoplayNext, settings.subtitles]);
  const src = server === ANIME_SERVER_ID ? animeSrc : embedSrc;
  activeSrcRef.current = Boolean(src);
  const playerKey = `${server}-${season}-${episode}-${startAt||'live'}-${animeLang}-${reloadNonce}`;

  const persistProgress = useCallback((p)=>{
    if (!p?.meta?.title) return;
    saveProgress(p.meta, { progress: p.ended?100:Math.min(99, Math.max(1,p.percent||1)), timestamp: p.ended?0:p.timestamp||0, duration: p.duration||0, season: p.meta.type==='tv'?p.season:undefined, episode: p.meta.type==='tv'?p.episode:undefined });
  },[saveProgress]);

  useEffect(()=>{
    if (!data) return;
    const key = `${type}:${id}:${season}:${episode}`;
    if (startedRef.current.has(key)) return;
    const meta=buildMeta(); if(!meta?.title) return;
    startedRef.current.add(key);
    const existing=savedRef.current;
    const sameEpisode = existing && (type!=='tv' || ((existing.season||1)===season && (existing.episode||1)===episode));
    progressRef.current = { meta, percent: sameEpisode? existing.progress||1:1, timestamp: sameEpisode? existing.timestamp||0:0, duration: sameEpisode? existing.duration||durationEstimateRef.current : durationEstimateRef.current, season, episode, real:false, ended:false };
    persistProgress(progressRef.current);
  },[data, type, id, season, episode, buildMeta, persistProgress]);

  useEffect(()=>{ baseRef.current=Number(startAt)||progressRef.current?.timestamp||0; elapsedRef.current=0; if(progressRef.current) progressRef.current.real=false; },[playerKey]);

  useEffect(()=>{
    const onMessage=(event)=>{
      const parsed=parseProgressMessage(event.data); if(!parsed) return;
      if(parsed.mediaId && String(parsed.mediaId)!==String(id)) return;
      const meta=metaRef.current; if(!meta?.title) return;
      const next={ meta, percent: parsed.ended?100:Math.min(99, parsed.percent||progressRef.current?.percent||1), timestamp: parsed.ended?0:parsed.current, duration: parsed.duration||progressRef.current?.duration||durationEstimateRef.current, season: type==='tv'? parsed.season||seasonRef.current:undefined, episode: type==='tv'? parsed.episode||episodeRef.current:undefined, real:true, ended: parsed.ended };
      progressRef.current=next; baseRef.current=parsed.current||baseRef.current; elapsedRef.current=0;
      const now=Date.now();
      if(!parsed.ended && !parsed.paused && now-lastSaveRef.current<4000) return;
      lastSaveRef.current=now; persistProgress(next);
      if(parsed.ended && type==='tv' && settings.autoplayNext) toast('Episode finished — saving your place.','info');
    };
    window.addEventListener('message',onMessage);
    return ()=>window.removeEventListener('message',onMessage);
  },[id,type,persistProgress,settings.autoplayNext,toast]);

  useEffect(()=>{
    if(!data) return;
    const timer=window.setInterval(()=>{
      if(document.hidden || !activeSrcRef.current) return;
      const p=progressRef.current; if(!p||p.real||p.ended||!p.meta?.title) return;
      elapsedRef.current+=10;
      const timestamp=baseRef.current+elapsedRef.current;
      const duration=p.duration||durationEstimateRef.current||0;
      const percent=duration>0?Math.min(96,(timestamp/duration)*100):Math.max(1,p.percent||1);
      progressRef.current={...p,timestamp,duration,percent};
      persistProgress(progressRef.current);
    },10000);
    return ()=>window.clearInterval(timer);
  },[data,persistProgress]);

  useEffect(()=>{ return ()=>{ if(progressRef.current?.meta?.title) persistProgress(progressRef.current); }; },[persistProgress]);

  const selectServer=(choice)=>{
    const ts=progressRef.current?.timestamp;
    if(ts && ts>30) setStartAt(Math.floor(ts));
    setServerChoice(choice);
    // update URL server param
    const next=new URLSearchParams(searchParams);
    next.set('server', String(choice));
    setSearchParams(next,{replace:true});
  };
  const changeSeason=(next)=>{ setSeason(next); setEpisode(1); setStartAt(undefined); };
  const changeEpisode=(next)=>{ setEpisode(next); setStartAt(undefined); };
  const startOver=()=>{
    setStartAt(undefined); setReloadNonce(n=>n+1); baseRef.current=0; elapsedRef.current=0;
    const meta=buildMeta(); if(meta){ progressRef.current={ meta, percent:1, timestamp:0, duration: progressRef.current?.duration||durationEstimateRef.current, season, episode, real:false, ended:false }; persistProgress(progressRef.current); }
    toast('Restarting from the beginning.','info');
  };

  const upNext = useMemo(()=>{ if(type!=='tv') return null; const idx=episodes.findIndex(ep=>ep.episode_number===episode); return idx>=0?episodes[idx+1]||null:null; },[episodes,episode,type]);

  if (loading) {
    return (
      <div className="container-page pt-8">
        <div className="skeleton h-8 w-52 mb-4" />
        <div className="skeleton aspect-video w-full rounded-2xl" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center pt-10 text-center">
        <div>
          <p className="text-lg font-semibold">{error || 'Stream unavailable'}</p>
          <button onClick={()=>navigate(-1)} className="btn-ghost mt-6"><ArrowLeft size={16}/> Go back</button>
        </div>
      </div>
    );
  }

  const inList = isInList({ id: Number(id), type });
  const serverLabel = server===ANIME_SERVER_ID ? 'Anime' : `Server ${server}`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-[#09090b] pb-10">
      {/* Top bar with title and close */}
      <div className="sticky top-[56px] z-30 border-b border-white/5 bg-[#09090b]/95 backdrop-blur">
        <div className="container-page flex h-[56px] items-center gap-3">
          <button onClick={()=>navigate(`/${type}/${id}`)} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15">
            <ArrowLeft size={14}/> Back
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-white">{title} <span className="font-normal text-white/40">{year && `• ${year}`}</span> {type==='tv' && <span className="ml-1 rounded bg-white/10 px-2 py-0.5 text-xs">S{season} E{episode}</span>} <span className="ml-2 text-xs text-white/30">{serverLabel}</span></h1>
            <p className="truncate text-xs text-white/40 hidden sm:block">{slug && `${slug} • `}server {server} • {type}</p>
          </div>
          <Link to={`/${type}/${id}`} className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-white/90">
            <X size={14}/> Close Player
          </Link>
          <button onClick={()=>navigate(`/${type}/${id}`)} className="grid h-8 w-8 place-items-center rounded-full bg-white text-black sm:hidden"><X size={14}/></button>
        </div>
      </div>

      <div className="container-page mt-4">
        {/* Player */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
          <div className="relative aspect-video w-full">
            {src ? (
              <iframe key={playerKey} src={src} title={`${title} player - ${serverLabel}`} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="origin" className="absolute inset-0 h-full w-full" />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[#111] p-6 text-center">
                <div>
                  <Loader2 size={20} className="mx-auto animate-spin text-white/50 mb-2"/>
                  <p className="text-sm font-semibold">Finding anime source…</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Server selector */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/30">Servers</span>
          {isAnime && (
            <button onClick={()=>selectServer(ANIME_SERVER_ID)} className={cx('rounded-full px-4 py-1.5 text-xs font-bold border', server===ANIME_SERVER_ID?'bg-white text-black border-white':'bg-white/10 text-white/70 border-white/10 hover:bg-white/15')}>
              Anime
            </button>
          )}
          {PLAYERS.map(s=>(
            <button key={s.id} onClick={()=>selectServer(s.id)} className={cx('rounded-full px-4 py-1.5 text-xs font-bold border', server===s.id?'bg-white text-black border-white':'bg-[#1e1e22] text-white/60 border-white/10 hover:bg-white/10')}>
              Server {s.id}
            </button>
          ))}
          <span className="ml-auto flex items-center gap-2">
            <button onClick={startOver} className="chip text-xs"><RotateCcw size={12}/> Start over</button>
            <button onClick={()=>setDownloads(true)} className="chip text-xs"><Download size={12}/> Download</button>
          </span>
        </div>

        {server===ANIME_SERVER_ID && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-white/30">Audio</span>
            {['sub','dub'].map(opt=>(
              <button key={opt} onClick={()=>setAnimeLang(opt)} className={cx('rounded-full px-3 py-1 text-xs font-semibold border', animeLang===opt?'bg-white text-black border-white':'bg-white/10 text-white/60')}>{opt.toUpperCase()}</button>
            ))}
          </div>
        )}

        <p className="mt-2 text-xs text-white/30">Stream not starting? Try another server. Share link: <span className="text-white/50 break-all">{shareUrl}</span></p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-2xl bg-[#18181b] border border-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold leading-tight">{title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">
                    {year && <span>{year}</span>}
                    {data.vote_average>0 && <span className="flex items-center gap-1"><Star size={11} className="fill-yellow-400 text-yellow-400"/>{Number(data.vote_average).toFixed(1)}</span>}
                    {type==='movie' && data.runtime && <span>{runtimeLabel(data.runtime)}</span>}
                    {data.genres?.slice(0,3).map(g=> <span key={g.id} className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">{g.name}</span>)}
                  </div>
                </div>
                <button
                  onClick={()=>{
                    const added=toggleList({ id: Number(id), type, title, poster: data.poster_path, backdrop: data.backdrop_path, rating: data.vote_average, year });
                    toast(added?'Added to My List':'Removed from My List', added?'success':'info');
                  }}
                  className={cx('inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold', inList?'bg-white text-black':'bg-white/10 text-white hover:bg-white/15')}
                >
                  {inList ? <Check size={14}/> : <Plus size={14}/>} {inList?'In My List':'My List'}
                </button>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {showDesc ? (currentEpisode?.overview || data.overview) : ((currentEpisode?.overview || data.overview || '').slice(0,220) + ((currentEpisode?.overview || data.overview || '').length>220?'…':''))}
                {(data.overview||'').length>220 && <button onClick={()=>setShowDesc(v=>!v)} className="ml-2 text-xs font-semibold text-white hover:underline">{showDesc?'Show less':'Show more'}</button>}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/${type}/${id}`} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 flex items-center gap-1"><Info size={12}/> Details</Link>
                <button onClick={()=>setDownloads(true)} className="rounded-full bg-[#1e1e22] px-4 py-2 text-xs font-semibold text-white border border-white/10 flex items-center gap-1"><Download size={12}/> Download</button>
                <button onClick={()=>navigate(`/${type}/${id}`)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white flex items-center gap-1"><X size={12}/> Close Player</button>
                <button onClick={()=>{ const added=toggleList({ id: Number(id), type, title, poster: data.poster_path, backdrop: data.backdrop_path, rating: data.vote_average, year }); toast(added?'Added to My List':'Removed from My List'); }} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white flex items-center gap-1"><Bookmark size={12}/> {inList?'Remove':'My List'}</button>
              </div>
            </div>

            {upNext && (
              <div className="mt-4 rounded-xl border border-white/5 bg-[#18181b] p-3">
                <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Up next</p>
                <button onClick={()=>changeEpisode(upNext.episode_number)} className="flex w-full gap-3 text-left">
                  <span className="w-[100px] shrink-0 overflow-hidden rounded-lg bg-black">
                    {upNext.still_path ? <img src={IMG.backdrop(upNext.still_path,'w300')} alt="" className="aspect-video object-cover"/> : <span className="grid aspect-video place-items-center text-xs text-white/20">E{upNext.episode_number}</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">E{upNext.episode_number} · {upNext.name}</span>
                    <span className="line-clamp-2 text-xs text-white/40">{upNext.overview||'Next episode'}</span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <aside>
            {type==='tv' ? (
              <div className="rounded-2xl bg-[#18181b] border border-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-sm">Episodes</h3>
                  <div className="relative">
                    <select value={season} onChange={e=>changeSeason(Number(e.target.value))} className="appearance-none rounded-full bg-black border border-white/10 px-3 py-1.5 pr-7 text-xs text-white">
                      {(data.seasons||[]).filter(s=>s.season_number>0).map(s=>(
                        <option key={s.id} value={s.season_number} className="bg-black">Season {s.season_number}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40"/>
                  </div>
                </div>
                {episodesLoading ? <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin" size={16}/></div> : (
                  <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                    {(showAll?episodes:episodes.slice(0,12)).map(ep=>(
                      <button key={ep.id} onClick={()=>changeEpisode(ep.episode_number)} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left', ep.episode_number===episode?'bg-white text-black':'text-white/60 hover:bg-white/5')}>
                        <span className="w-6 text-xs font-bold">{ep.episode_number}</span>
                        <span className="flex-1 truncate text-xs">{ep.name||`Episode ${ep.episode_number}`}</span>
                        {ep.runtime && <span className="text-[10px] opacity-50">{ep.runtime}m</span>}
                      </button>
                    ))}
                    {episodes.length>12 && <button onClick={()=>setShowAll(v=>!v)} className="w-full py-2 text-xs text-white/50 hover:text-white">{showAll?'Show fewer':`Show all ${episodes.length}`}</button>}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#18181b] border border-white/5 p-4">
                <h3 className="font-bold text-sm mb-3">Downloads</h3>
                {[1,2].map(sid=>(
                  <a key={sid} href={downloadUrl(sid,type,id)} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5 text-xs font-medium text-white/70 hover:bg-white/10 mb-2">
                    Source {sid} <Download size={12}/>
                  </a>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>

      <DownloadModal open={downloads} onClose={()=>setDownloads(false)} type={type} id={id} title={`${title}${year?` (${year})`:''}`} season={season} episode={episode} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Download, Server } from "lucide-react";
import { getMovieDetails, getTVDetails, getSeasonDetails } from "../lib/tmdb";
import { useWatchHistory } from "../context/WatchHistoryContext";

const sources = [
  { id: "tgvid", label: "Server 1", color: "dcff00" },
  { id: "vidstuck", label: "Server 2", color: "8B5CF6" },
];

export default function Watch() {
  const { type, id, season: seasonParam, episode: episodeParam } = useParams();
  const mediaType = type==="tv" ? "tv" : "movie";
  const navigate = useNavigate();
  const [source, setSource] = useState(()=> localStorage.getItem("priva_default_server") || "tgvid");
  const [data, setData] = useState(null);
  const [season, setSeason] = useState(seasonParam ? Number(seasonParam) : 1);
  const [episode, setEpisode] = useState(episodeParam ? Number(episodeParam) : 1);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const { addToHistory, updateProgress } = useWatchHistory();

  useEffect(()=> {
    const saved = localStorage.getItem("priva_default_server");
    if(saved && ["tgvid","vidstuck"].includes(saved)) setSource(saved);
  }, []);

  useEffect(()=> {
    async function load(){
      try {
        const d = mediaType==="movie" ? await getMovieDetails(id) : await getTVDetails(id);
        setData(d);
        if(mediaType==="tv") {
          const s = d.seasons?.filter(s=> s.season_number>0) || [];
          setSeasons(s);
          if(seasonParam) setSeason(Number(seasonParam));
          else if(s.length) setSeason(s[0].season_number);
        }
      } catch(e){ console.error(e); }
    }
    load();
    window.scrollTo(0,0);
  }, [id, mediaType, seasonParam]);

  useEffect(()=> {
    if(mediaType==="tv" && data && season) {
      getSeasonDetails(id, season).then(s=> setEpisodes(s.episodes||[])).catch(()=>{});
      if(episodeParam) setEpisode(Number(episodeParam));
    }
  }, [season, data, mediaType, id, episodeParam]);

  useEffect(()=> {
    if(data) {
      addToHistory({ id: Number(id), media_type: mediaType, title: data.title || data.name, poster_path: data.poster_path, backdrop_path: data.backdrop_path, vote_average: data.vote_average });
    }
  }, [data, id, mediaType, addToHistory]);

  useEffect(()=> {
    const handler = (e) => {
      const d = e.data;
      if(!d) return;
      if(d.type==="TGFLIX_EVENT" && (d.event==="timeupdate" || d.event==="pause")) {
        const key = mediaType==="movie" ? `movie:${id}` : `tv:${id}:s${season}e${episode}`;
        const pct = d.duration ? Math.round((d.currentTime/d.duration)*100) : 0;
        const left = d.duration - d.currentTime;
        const timeLeft = left>0 ? `${Math.floor(left/60)}m left` : "watched";
        updateProgress(key, { pct, timeLeft, currentTime: d.currentTime, duration: d.duration, mediaType, tmdbId: id, season, episode });
        const histKey = `${mediaType}:${id}`;
        updateProgress(histKey, { pct, timeLeft });
      }
      if(typeof e.data==="string") {
        try {
          const parsed = JSON.parse(e.data);
          if(parsed.progress!==undefined) {
            const key = mediaType==="movie" ? `movie:${id}` : `tv:${id}:s${season}e${episode}`;
            updateProgress(key, { pct: parsed.progress, timeLeft: `${Math.round(parsed.timestamp)}s`, mediaType });
          }
        } catch {}
      }
    };
    window.addEventListener("message", handler);
    return ()=> window.removeEventListener("message", handler);
  }, [mediaType, id, season, episode, updateProgress]);

  if(!data) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white/50 pt-[64px]">Loading player...</div>;
  }

  const title = data.title || data.name;
  const getSrc = () => {
    if(source==="tgvid") {
      if(mediaType==="movie") return `https://tgvid.lovable.app/embed/movie/${id}?color=dcff00&back=true&episodeSelector=true&autoplayNextEp=true`;
      return `https://tgvid.lovable.app/embed/tv/${id}/${season}/${episode}?color=dcff00&back=true&episodeSelector=true&autoplayNextEp=true`;
    } else {
      if(mediaType==="movie") return `https://vidstuck.cc/embed/movie/${id}?color=dcff00&branding=PRIVA&autoplayNextEpisode=true&episodeSelector=true`;
      return `https://vidstuck.cc/embed/tv/${id}/${season}/${episode}?color=dcff00&branding=PRIVA&autoplayNextEpisode=true&episodeSelector=true&nextEpisode=true`;
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col pt-[64px]">
      <div className="h-[48px] bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={()=> navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 shrink-0"><ArrowLeft size={18}/></button>
          <div className="hidden md:block min-w-0">
            <div className="text-sm font-semibold line-clamp-1">{title}</div>
            <div className="text-xs text-white/50 line-clamp-1">{mediaType==="movie" ? "Movie" : `S${season} E${episode} — ${episodes.find(e=> e.episode_number===episode)?.name || ""}`}</div>
          </div>
          <div className="md:hidden text-sm font-semibold line-clamp-1">{title}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            {sources.map(s=> (
              <button key={s.id} onClick={()=> setSource(s.id)} className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${source===s.id ? "bg-white text-black" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                <Server size={12}/> {s.label}
              </button>
            ))}
          </div>
          <button onClick={()=> navigate("/settings")} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"><Settings size={16} className="opacity-60"/></button>
        </div>
      </div>

      <div className="md:hidden flex gap-2 px-4 py-3 bg-[#0a0a0a] border-b border-white/10">
        {sources.map(s=> (
          <button key={s.id} onClick={()=> setSource(s.id)} className={`flex-1 py-2 rounded-full text-xs font-medium border ${source===s.id ? "bg-white text-black border-white" : "bg-white/10 text-white border-white/10"}`}>{s.label}</button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 bg-black relative">
          <div className="aspect-video lg:aspect-auto lg:h-[calc(100vh-112px)] w-full bg-black">
            <iframe
              key={`${source}-${mediaType}-${id}-${season}-${episode}`}
              src={getSrc()}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              title={`Watch ${title}`}
            />
          </div>
        </div>

        {mediaType==="tv" && (
          <div className="w-full lg:w-[360px] bg-[#0f0f0f] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-112px)]">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Episodes</h3>
                <select value={season} onChange={e=> { setSeason(Number(e.target.value)); setEpisode(1); navigate(`/watch/tv/${id}/${e.target.value}/1`); }} className="bg-white text-black rounded-full px-3 py-1 text-xs font-medium">
                  {seasons.map(s=> <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {episodes.map(ep=> (
                <button key={ep.id} onClick={()=> { setEpisode(ep.episode_number); navigate(`/watch/tv/${id}/${season}/${ep.episode_number}`); }} className={`w-full flex gap-3 p-2 rounded-xl text-left hover:bg-white/5 ${episode===ep.episode_number ? "bg-white/10 border border-white/10" : "border border-transparent"}`}>
                  <div className="w-20 aspect-video rounded-lg bg-[#1a1a1e] overflow-hidden shrink-0 relative">
                    {ep.still_path ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/30">No Image</div>}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black text-[10px]">▶</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium line-clamp-1">{ep.episode_number}. {ep.name}</div>
                    <div className="text-[11px] text-white/50 line-clamp-2 mt-0.5">{ep.overview?.slice(0,80) || "No overview"}</div>
                    <div className="text-[10px] text-white/30 mt-1">{ep.air_date} • {ep.runtime ? `${ep.runtime}m` : ""}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-white/5 space-y-2">
              <h4 className="text-xs font-semibold text-white/60">Download this episode</h4>
              <a href={`https://dl.vidsrc.party/tv/${id}/${season}/${episode}`} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 rounded-full bg-white text-black text-xs font-semibold text-center">Download via dl.vidsrc.party</a>
              <a href={`https://vidvault.to/tv/${id}/${season}/${episode}`} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-center hover:bg-white/15">Download via vidvault.to</a>
            </div>
          </div>
        )}

        {mediaType==="movie" && (
          <div className="hidden lg:flex lg:w-[320px] bg-[#0f0f0f] border-l border-white/10 p-4 flex-col gap-3">
            <h3 className="font-semibold text-sm">About</h3>
            <p className="text-xs text-white/60 leading-relaxed line-clamp-4">{data.overview}</p>
            <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs font-semibold">Download Movie</div>
              <div className="grid gap-2 mt-2">
                <a href={`https://dl.vidsrc.party/movie/${id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2.5 rounded-full bg-white text-black text-xs font-semibold text-center">Download 1080p</a>
                <div className="grid grid-cols-3 gap-2">
                  {["720p","480p","1080p"].map(q=> <a key={q} href={`https://dl.vidsrc.party/download/movie/${id}?quality=${q}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1.5 rounded-full bg-white/10 border border-white/10 text-[11px] text-center hover:bg-white/15">{q}</a>)}
                </div>
                <a href={`https://vidvault.to/movie/${id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-center hover:bg-white/10">vidvault.to</a>
              </div>
            </div>
            <button onClick={()=> navigate(`/${mediaType}/${id}`)} className="mt-2 w-full py-2.5 rounded-full bg-white/10 border border-white/10 text-sm flex items-center justify-center gap-2 hover:bg-white/15"><Download size={14}/> View Details</button>
          </div>
        )}
      </div>
    </div>
  )
}

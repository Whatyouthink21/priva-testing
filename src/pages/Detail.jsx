import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star, Calendar, Clock, Play, Plus, Check, Download, Share2, Languages, Award, Building2, Users, Film, ArrowLeft, Info } from "lucide-react";
import { getMovieDetails, getTVDetails, img, formatRuntime, yearFromDate, getSeasonDetails } from "../lib/tmdb";
import { useList } from "../context/ListContext";
import { useWatchHistory } from "../context/WatchHistoryContext";
import MediaRow from "../components/MediaRow";

export default function Detail({ forcedType }) {
  const params = useParams();
  const type = forcedType || params.type;
  const id = params.id;
  const mediaType = type === "tv" ? "tv" : "movie";
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const { isInList, toggleList } = useList();
  const { addToHistory } = useWatchHistory();

  useEffect(()=> {
    async function load(){
      setLoading(true);
      try {
        const d = mediaType==="movie" ? await getMovieDetails(id) : await getTVDetails(id);
        setData(d);
        if(mediaType==="tv" && d.seasons && d.seasons.length) {
          const s = d.seasons.find(s=> s.season_number>0) || d.seasons[0];
          if(s) setSelectedSeason(s.season_number);
        }
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  }, [id, mediaType]);

  useEffect(()=> {
    if(mediaType==="tv" && data && selectedSeason) {
      getSeasonDetails(id, selectedSeason).then(season=> setEpisodes(season.episodes||[])).catch(()=>{});
    }
  }, [selectedSeason, data, id, mediaType]);

  if(loading) {
    return (
      <div className="min-h-screen bg-[#080808] pt-20">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="h-[50vh] bg-[#111] rounded-2xl shimmer" />
          <div className="mt-6 h-96 bg-[#111] rounded-2xl shimmer" />
        </div>
      </div>
    )
  }
  if(!data) return <div className="min-h-screen bg-[#080808] flex items-center justify-center">Not found</div>;

  const title = data.title || data.name;
  const year = yearFromDate(data.release_date || data.first_air_date);
  const runtime = mediaType==="movie" ? formatRuntime(data.runtime) : (data.number_of_seasons ? `${data.number_of_seasons} Season${data.number_of_seasons>1?'s':''}` : null);
  const rating = data.vote_average ? data.vote_average.toFixed(1) : null;
  const voteCount = data.vote_count ? data.vote_count.toLocaleString() : null;
  const backdrop = img.backdrop(data.backdrop_path, "original") || img.backdrop(data.poster_path,"original");
  const poster = img.poster(data.poster_path, "w500");
  const genres = data.genres || [];
  const credits = data.credits || data.aggregate_credits || { cast: [], crew: [] };
  const cast = credits.cast?.slice(0,12) || [];
  const crew = credits.crew || [];
  const director = crew.find(c=> c.job==="Director");
  const videos = data.videos?.results || [];
  const trailer = videos.find(v=> v.type==="Trailer" && v.site==="YouTube") || videos[0];
  const recommendations = data.recommendations?.results?.slice(0,12).map(r=> ({...r, media_type: mediaType})) || [];
  const similar = data.similar?.results?.slice(0,12).map(r=> ({...r, media_type: mediaType})) || [];
  const companies = data.production_companies || [];
  const inList = isInList(data.id, mediaType);

  const handlePlay = (seasonNum, episodeNum) => {
    addToHistory({ id: data.id, media_type: mediaType, title, poster_path: data.poster_path, backdrop_path: data.backdrop_path, vote_average: data.vote_average });
    if(mediaType==="movie") navigate(`/watch/${mediaType}/${id}`);
    else navigate(`/watch/${mediaType}/${id}/${seasonNum||selectedSeason}/${episodeNum||1}`);
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Backdrop hero */}
      <div className="relative h-[58vh] md:h-[76vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          {backdrop && <img src={backdrop} alt={title} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-[#080808]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-transparent to-transparent" />
        </div>

        <div className="relative h-full max-w-[1600px] mx-auto px-4 md:px-8 flex flex-col justify-end pb-8 md:pb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6 w-fit">
            <ArrowLeft size={16}/> Back to Home
          </Link>

          <div className="flex gap-6 md:gap-8">
            <div className="hidden md:block shrink-0">
              <div className="w-[220px] aspect-[2/3] rounded-2xl overflow-hidden bg-[#141414] border border-white/10">
                {poster ? <img src={poster} alt={title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20">No Poster</div>}
              </div>
            </div>

            <div className="flex-1 min-w-0 max-w-[720px]">
              <h1 className="text-[28px] md:text-[40px] font-black tracking-tight leading-none">{title}</h1>
              {data.tagline && <p className="text-sm italic text-white/50 mt-2">"{data.tagline}"</p>}

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[13px] text-white/80">
                {rating && <span className="flex items-center gap-1.5 bg-white text-black px-2.5 py-1 rounded-full font-bold text-xs"><Star size={12} className="fill-black"/> {rating}/10 <span className="font-normal opacity-60">· {voteCount} votes</span></span>}
                {year && <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full"><Calendar size={12}/> {year}</span>}
                {runtime && <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full"><Clock size={12}/> {runtime}</span>}
                {data.original_language && <span className="bg-white/10 px-2.5 py-1 rounded-full uppercase text-xs">{data.original_language}</span>}
                {data.adult !== undefined && <span className="bg-white/10 px-2 py-1 rounded-full text-xs">{data.adult ? "18+" : "PG-13"}</span>}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {genres.map(g=> <span key={g.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">{g.name}</span>)}
              </div>

              <p className="text-sm leading-relaxed text-white/75 mt-4 line-clamp-3 md:line-clamp-4 max-w-[640px]">{data.overview || "No overview available."}</p>

              {/* Production companies mini */}
              {companies.length>0 && (
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <span className="text-xs text-white/40 flex items-center gap-1"><Building2 size={12}/> Production:</span>
                  {companies.slice(0,4).map(c=> (
                    <span key={c.id} className="text-xs bg-white/5 px-2 py-1 rounded-full border border-white/5">{c.name}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button onClick={()=> handlePlay()} className="h-11 px-7 rounded-full bg-white text-black font-bold flex items-center gap-2 hover:bg-white/90">
                  <Play size={18} className="fill-black"/> Play
                </button>
                <button onClick={()=> toggleList({ id: data.id, media_type: mediaType, title, poster_path: data.poster_path, backdrop_path: data.backdrop_path, vote_average: data.vote_average })} className={`h-11 px-5 rounded-full border font-medium flex items-center gap-2 ${inList ? "bg-white text-black border-white" : "bg-white/10 border-white/15 hover:bg-white/15"}`}>
                  {inList ? <Check size={16}/> : <Plus size={16}/>} {inList ? "Added" : "My List"}
                </button>
                <button onClick={()=> setShowDownloads(v=>!v)} className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15">
                  <Download size={18}/>
                </button>
                <button className="h-11 w-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15">
                  <Share2 size={16}/>
                </button>
              </div>

              {showDownloads && (
                <div className="mt-4 p-4 rounded-2xl bg-[#141414] border border-white/10">
                  <h4 className="font-semibold flex items-center gap-2"><Download size={14}/> Download Options</h4>
                  <p className="text-xs text-white/50 mt-1">Choose quality and format. Files are muxed on the fly.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    {mediaType==="movie" ? (
                      <>
                        <a href={`https://dl.vidsrc.party/movie/${id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm flex items-center justify-between">dl.vidsrc.party <span className="text-xs opacity-60">1080p • MP4</span></a>
                        <a href={`https://vidvault.to/movie/${id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 font-medium text-sm flex items-center justify-between">vidvault.to <span className="text-xs opacity-60">720p/1080p</span></a>
                        {["1080p","720p","480p"].map(q=> (
                          <a key={q} href={`https://dl.vidsrc.party/download/movie/${id}?quality=${q}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10">Download {q}</a>
                        ))}
                      </>
                    ) : (
                      <>
                        <a href={`https://dl.vidsrc.party/tv/${id}/${selectedSeason}/1`} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm">Download via dl.vidsrc.party</a>
                        <a href={`https://vidvault.to/tv/${id}/${selectedSeason}/1`} target="_blank" rel="noopener noreferrer" className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 font-medium text-sm">Download via vidvault.to</a>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-white/30 mt-3">External download providers. PRIVA does not host files.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details body */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {/* Metadata grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Trailer */}
            {trailer && (
              <div className="rounded-2xl overflow-hidden bg-black border border-white/5">
                <div className="p-4 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Film size={16}/> Trailer & Videos</h3>
                  <a href={`https://youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-white text-black px-3 py-1 rounded-full font-medium">Watch on YouTube</a>
                </div>
                <div className="aspect-video bg-black">
                  <iframe src={`https://www.youtube.com/embed/${trailer.key}`} title={trailer.name} className="w-full h-full" allowFullScreen allow="encrypted-media" />
                </div>
              </div>
            )}

            {/* TV Season / Episode selector */}
            {mediaType==="tv" && (
              <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Episodes</h3>
                  <select value={selectedSeason} onChange={e=> setSelectedSeason(Number(e.target.value))} className="bg-white text-black rounded-full px-4 py-1.5 text-sm font-medium">
                    {data.seasons.filter(s=> s.season_number>=0).map(s=> <option key={s.id} value={s.season_number}>Season {s.season_number} • {s.episode_count} eps</option>)}
                  </select>
                </div>
                <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {episodes.map(ep=> (
                    <div key={ep.id} className="flex gap-3 p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5">
                      <div className="w-[140px] aspect-video rounded-lg overflow-hidden bg-[#1a1a1e] shrink-0 relative">
                        {ep.still_path ? <img src={img.backdrop(ep.still_path, "w300")} alt={ep.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No still</div>}
                        <button onClick={()=> handlePlay(selectedSeason, ep.episode_number)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center"><Play size={14} className="fill-black ml-0.5"/></div>
                        </button>
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded">E{ep.episode_number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium line-clamp-1">{ep.episode_number}. {ep.name}</div>
                        <div className="text-xs text-white/50 line-clamp-2 mt-1">{ep.overview || "No overview."} </div>
                        <div className="text-[11px] text-white/30 mt-1 flex items-center gap-2">
                          <span>{ep.air_date || "TBA"}</span>
                          {ep.vote_average>0 && <span>• {ep.vote_average.toFixed(1)}/10</span>}
                          {ep.runtime && <span>• {ep.runtime}m</span>}
                        </div>
                      </div>
                      <button onClick={()=> handlePlay(selectedSeason, ep.episode_number)} className="self-center h-8 px-4 rounded-full bg-white text-black text-xs font-semibold">Play</button>
                    </div>
                  ))}
                  {episodes.length===0 && <div className="text-sm text-white/50 py-10 text-center">No episodes found.</div>}
                </div>
              </div>
            )}

            {/* Cast */}
            <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Users size={16}/> Cast</h3>
                <Link to="#" className="text-xs text-white/50">View all</Link>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-4">
                {cast.map(person=> (
                  <Link key={person.id} to={`/person/${person.id}`} className="text-center group">
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1a1e]">
                      {person.profile_path ? <img src={img.profile(person.profile_path,"w185")} alt={person.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"/> : <div className="w-full h-full flex items-center justify-center text-white/20">No photo</div>}
                    </div>
                    <div className="text-xs font-medium mt-2 line-clamp-1">{person.name}</div>
                    <div className="text-[11px] text-white/50 line-clamp-1">{person.character}</div>
                  </Link>
                ))}
                {cast.length===0 && <div className="col-span-full text-sm text-white/50">No cast info.</div>}
              </div>
            </div>

            {/* Crew */}
            {crew.length>0 && (
              <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-4 md:p-6">
                <h3 className="font-semibold flex items-center gap-2"><Award size={16}/> Crew</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {crew.slice(0,9).map(p=> (
                    <Link key={`${p.id}-${p.job}`} to={`/person/${p.id}`} className="flex gap-3 p-2 rounded-xl hover:bg-white/5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a1a1e] shrink-0">
                        {p.profile_path ? <img src={img.profile(p.profile_path,"w185")} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-xs">?</div>}
                      </div>
                      <div>
                        <div className="text-sm font-medium line-clamp-1">{p.name}</div>
                        <div className="text-xs text-white/50">{p.job}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Mobile poster */}
            <div className="md:hidden flex gap-4">
              <div className="w-[110px] aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a1e] shrink-0">
                {poster && <img src={poster} alt={title} className="w-full h-full object-cover"/>}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{title}</div>
                <div className="text-xs text-white/50 mt-1">{year} • {genres.map(g=> g.name).join(", ")}</div>
                <div className="mt-3 flex gap-2">
                  <button onClick={()=> handlePlay()} className="flex-1 h-9 rounded-full bg-white text-black font-semibold text-xs flex items-center justify-center gap-1"><Play size={12} className="fill-black"/> Play</button>
                </div>
              </div>
            </div>

            <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-5">
              <h4 className="font-semibold text-sm">Details</h4>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-white/40">Status</span><span className="font-medium">{data.status || "—"}</span></div>
                <div className="flex justify-between gap-4"><span className="text-white/40">Original Title</span><span className="font-medium text-right line-clamp-1">{data.original_title || data.original_name}</span></div>
                {mediaType==="movie" && data.budget>0 && <div className="flex justify-between"><span className="text-white/40">Budget</span><span>${(data.budget/1e6).toFixed(1)}M</span></div>}
                {mediaType==="movie" && data.revenue>0 && <div className="flex justify-between"><span className="text-white/40">Revenue</span><span>${(data.revenue/1e6).toFixed(1)}M</span></div>}
                {mediaType==="tv" && <div className="flex justify-between"><span className="text-white/40">Seasons</span><span>{data.number_of_seasons} • {data.number_of_episodes} episodes</span></div>}
                <div className="flex justify-between"><span className="text-white/40">Languages</span><span>{data.spoken_languages?.map(l=> l.english_name).join(", ") || data.original_language}</span></div>
                <div className="flex justify-between"><span className="text-white/40">Rating</span><span className="bg-white text-black px-2 py-0.5 rounded-full text-xs font-bold">{rating}/10</span></div>
              </div>

              {companies.length>0 && (
                <div className="mt-6">
                  <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1"><Building2 size={12}/> Production Companies</h5>
                  <div className="mt-3 space-y-2">
                    {companies.map(c=> (
                      <div key={c.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1">
                          {c.logo_path ? <img src={img.logo(c.logo_path,"w200")} alt={c.name} className="max-w-full max-h-full object-contain" /> : <span className="text-[10px] font-bold text-black">{c.name[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-white/40">{c.origin_country || "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.networks && data.networks.length>0 && (
                <div className="mt-6">
                  <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Networks</h5>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.networks.map(n=> <span key={n.id} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">{n.name}</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* IMDB / External */}
            <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-5">
              <h4 className="font-semibold text-sm flex items-center gap-2"><Award size={14}/> Ratings & Links</h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-lg font-black">{rating}</div>
                  <div className="text-[11px] text-white/50">TMDB Rating</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-lg font-black">{yearFromDate(data.release_date||data.first_air_date)}</div>
                  <div className="text-[11px] text-white/50">Year</div>
                </div>
              </div>
              {data.external_ids?.imdb_id && (
                <a href={`https://imdb.com/title/${data.external_ids.imdb_id}`} target="_blank" rel="noopener noreferrer" className="mt-3 w-full h-9 rounded-full bg-[#f5c518] text-black font-bold text-sm flex items-center justify-center">View on IMDb</a>
              )}
              {data.homepage && (
                <a href={data.homepage} target="_blank" rel="noopener noreferrer" className="mt-2 w-full h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm">Official Website</a>
              )}
            </div>
          </div>
        </div>

        {recommendations.length>0 && <div className="mt-8"><MediaRow title="More Like This" items={recommendations} /></div>}
        {similar.length>0 && <div><MediaRow title="Similar Titles" items={similar} /></div>}
      </div>
    </div>
  )
}

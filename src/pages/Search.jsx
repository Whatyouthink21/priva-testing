import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, TrendingUp } from "lucide-react";
import { getTrending, searchMulti } from "../lib/tmdb";
import { img } from "../lib/tmdb";
import SearchBar from "../components/SearchBar";
import MediaCard from "../components/MediaCard";

const quickSearches = ["the 100","breaking bad","stranger things","avengers","the office","game of thrones","wednesday"];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(()=> {
    async function loadTrending(){
      const data = await getTrending("all","day");
      setTrending((data.results||[]).slice(0,10).map(r=> ({...r, media_type: r.media_type || (r.title ? "movie":"tv")})));
    }
    loadTrending();
  },[]);

  useEffect(()=> {
    if(!q) { setResults([]); return; }
    async function doSearch(){
      setLoading(true);
      try {
        const data = await searchMulti(q, 1);
        setResults((data.results||[]).filter(r=> r.media_type!=="person" || r.profile_path).slice(0,30));
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    doSearch();
  }, [q]);

  const personResults = results.filter(r=> r.media_type==="person");
  const titleResults = results.filter(r=> r.media_type!=="person");

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Hero search area like screenshot 5 */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(1200px 600px at 50% 10%, #1a3a0a 0%, #0a1f00 30%, #080808 70%)" }} />
        <div className="absolute inset-0 opacity-30" style={{ background: "linear-gradient(180deg, transparent 0%, #080808 100%)" }} />
        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 pt-10 pb-8">
          <div className="text-center max-w-[700px] mx-auto">
            <h1 className="text-[24px] md:text-[28px] font-bold tracking-tight">Discover something new</h1>
            <div className="mt-5">
              <SearchBar initialValue={q} />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {quickSearches.slice(0,4).map(term=> (
                  <button key={term} onClick={()=> navigate(`/search?q=${encodeURIComponent(term)}`)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"> {term} </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 pb-12">
        {q ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Results for "{q}" <span className="text-white/40 font-normal text-sm ml-2">{results.length} found</span></h2>
              <Link to="/search" className="text-sm text-white/50 hover:text-white">Clear</Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({length:10}).map((_,i)=> <div key={i} className="aspect-[2/3] bg-[#141414] rounded-xl shimmer" />)}
              </div>
            ) : titleResults.length===0 && personResults.length===0 ? (
              <div className="py-20 text-center text-white/50">No results found. Try another search term.</div>
            ) : (
              <>
                {titleResults.length>0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {titleResults.map(item=> (
                      <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
                    ))}
                  </div>
                )}
                {personResults.length>0 && (
                  <div className="mt-10">
                    <h3 className="font-semibold mb-4">People</h3>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                      {personResults.map(p=> (
                        <Link key={p.id} to={`/person/${p.id}`} className="min-w-[120px] text-center">
                          <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#1a1a1e] mx-auto">
                            {p.profile_path ? <img src={img.profile(p.profile_path, "w185")} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/30">?</div>}
                          </div>
                          <div className="text-sm font-medium mt-2 line-clamp-1">{p.name}</div>
                          <div className="text-xs text-white/50">{p.known_for_department}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            {/* Trending Today section */}
            <div className="mt-8">
              <h2 className="text-center text-lg font-semibold mb-6">Trending Today</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {trending.slice(0,10).map(item=> (
                  <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
                ))}
              </div>
            </div>

            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-6">
                <h3 className="font-semibold flex items-center gap-2"><TrendingUp size={16}/> Popular Searches</h3>
                <div className="flex flex-wrap gap-2 mt-4">
                  {quickSearches.map(t=> (
                    <button key={t} onClick={()=> navigate(`/search?q=${encodeURIComponent(t)}`)} className="px-3 py-1.5 rounded-full bg-white/5 text-sm hover:bg-white/10">{t}</button>
                  ))}
                </div>
              </div>
              <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-6">
                <h3 className="font-semibold">Browse Categories</h3>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link to="/movies" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-center font-medium">Movies</Link>
                  <Link to="/shows" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-center font-medium">TV Shows</Link>
                  <Link to="/provider/8?name=Netflix" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-center font-medium">Netflix</Link>
                  <Link to="/provider/337?name=Disney%20Plus" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-center font-medium">Disney+</Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

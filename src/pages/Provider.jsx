import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { discoverMovies, discoverTV } from "../lib/tmdb";
import MediaCard from "../components/MediaCard";

const providerMeta = {
  "8": { name: "Netflix", color: "#E50914", bg: "radial-gradient(ellipse at top, #1a1a2e 0%, #0f172a 50%, #080808 100%)" },
  "119": { name: "Amazon Prime Video", color: "#00A8E1" },
  "337": { name: "Disney Plus", color: "#0A0B3F" },
  "350": { name: "Apple TV+", color: "#000" },
  "15": { name: "Hulu", color: "#1CE783" },
  "531": { name: "Paramount Plus", color: "#0064FF" },
  "1899": { name: "Max", color: "#000" },
};

export default function ProviderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || providerMeta[id]?.name || "Provider";
  const [tab, setTab] = useState("movies");
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    async function load(){
      setLoading(true);
      try {
        const [m, s] = await Promise.all([
          discoverMovies({ with_watch_providers: id, watch_region: "US", sort_by: "popularity.desc", page: 1 }),
          discoverTV({ with_watch_providers: id, watch_region: "US", sort_by: "popularity.desc", page: 1 }),
        ]);
        setMovies((m.results||[]).map(r=> ({...r, media_type: "movie"})));
        setSeries((s.results||[]).map(r=> ({...r, media_type: "tv"})));
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  const meta = providerMeta[id] || { name, color: "#dcff00" };

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <div className="relative overflow-hidden pt-[64px]" style={{ background: "linear-gradient(180deg, #0a1a0a 0%, #0d2b0d 30%, #080808 100%)" }}>
        <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(600px 400px at 20% 0%, ${meta.color}22, transparent 60%), radial-gradient(800px 600px at 90% 10%, #00ff88 14, transparent 60%)` }} />
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse 1200px 600px at 50% -20%, rgba(220,255,0,0.18), transparent 70%)" }} />

        <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 pt-6 pb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6">
            <ArrowLeft size={16} /> Back
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-black font-black text-xl overflow-hidden border border-white/10">
              {name==="Netflix" ? <span className="text-[#E50914] text-2xl">N</span> : <span>{name[0]}</span>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          </div>

          <div className="mt-6 inline-flex bg-black/40 backdrop-blur rounded-full p-1 border border-white/10">
            <button onClick={()=> setTab("movies")} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${tab==="movies" ? "bg-white text-black" : "text-white/70 hover:text-white"}`}>Movies</button>
            <button onClick={()=> setTab("series")} className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${tab==="series" ? "bg-white text-black" : "text-white/70 hover:text-white"}`}>Series</button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({length:12}).map((_,i)=> <div key={i} className="aspect-[2/3] bg-[#141414] rounded-xl shimmer" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3 md:gap-5">
              {(tab==="movies" ? movies : series).map(item=> (
                <MediaCard key={item.id} item={item} variant="portrait" />
              ))}
            </div>
            {(tab==="movies" ? movies : series).length===0 && (
              <div className="py-20 text-center text-white/50">No titles found for this provider in US region. Try another provider.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Star } from "lucide-react";
import { getPersonDetails, img } from "../lib/tmdb";
import MediaCard from "../components/MediaCard";

export default function Person() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    async function load(){
      setLoading(true);
      try {
        const d = await getPersonDetails(id);
        setData(d);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  }, [id]);

  if(loading) return <div className="min-h-screen bg-[#080808] pt-20 px-8"><div className="h-96 bg-[#111] rounded-2xl shimmer" /></div>;
  if(!data) return <div className="min-h-screen bg-[#080808] flex items-center justify-center">Not found</div>;

  const knownFor = data.combined_credits?.cast?.slice(0,18).map(r=> ({...r, media_type: r.media_type})) || [];
  const crewJobs = data.combined_credits?.crew?.slice(0,12) || [];

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6"><ArrowLeft size={16}/> Back</Link>

        <div className="grid md:grid-cols-[320px_1fr] gap-8">
          <div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#141414] border border-white/10">
              {data.profile_path ? <img src={img.profile(data.profile_path,"h632")} alt={data.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white/20">No photo</div>}
            </div>
            <div className="mt-6 bg-[#0f0f0f] rounded-2xl border border-white/5 p-5">
              <h3 className="font-semibold">Personal Info</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div><div className="text-white/40 text-xs">Known for</div><div className="font-medium">{data.known_for_department}</div></div>
                {data.birthday && <div><div className="text-white/40 text-xs flex items-center gap-1"><Calendar size={12}/> Birthday</div><div>{data.birthday} {data.deathday ? `— ${data.deathday}` : ""}</div></div>}
                {data.place_of_birth && <div><div className="text-white/40 text-xs flex items-center gap-1"><MapPin size={12}/> Place of Birth</div><div>{data.place_of_birth}</div></div>}
                {data.also_known_as?.length>0 && <div><div className="text-white/40 text-xs">Also Known As</div><div className="text-sm">{data.also_known_as.slice(0,3).join(", ")}</div></div>}
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight">{data.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-3 py-1 rounded-full bg-white text-black text-xs font-bold">{data.known_for_department}</span>
              {data.popularity && <span className="px-3 py-1 rounded-full bg-white/10 text-xs flex items-center gap-1"><Star size={12}/> {data.popularity.toFixed(1)} popularity</span>}
            </div>

            {data.biography ? (
              <div className="mt-6">
                <h3 className="font-semibold">Biography</h3>
                <p className="text-sm leading-relaxed text-white/70 mt-2 whitespace-pre-line">{data.biography || "No biography available."}</p>
              </div>
            ) : (
              <p className="text-sm text-white/50 mt-6">No biography available.</p>
            )}

            {knownFor.length>0 && (
              <div className="mt-8">
                <h3 className="font-semibold">Known For</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                  {knownFor.map(item=> <MediaCard key={`${item.id}-${item.credit_id}`} item={item} />)}
                </div>
              </div>
            )}

            {crewJobs.length>0 && (
              <div className="mt-8">
                <h3 className="font-semibold">Crew Credits</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {crewJobs.map(item=> <MediaCard key={`${item.id}-${item.credit_id}-crew`} item={item} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

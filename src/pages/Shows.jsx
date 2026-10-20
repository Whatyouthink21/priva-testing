import { useEffect, useState } from "react";
import { getPopularTV, getTopRatedTV, getOnTheAir, getTrending, discoverTV } from "../lib/tmdb";
import MediaRow from "../components/MediaRow";

export default function Shows() {
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [onAir, setOnAir] = useState([]);
  const [trending, setTrending] = useState([]);
  const [kids, setKids] = useState([]);

  useEffect(()=> {
    async function load(){
      const [pop, top, air, trend, kidsRes] = await Promise.all([
        getPopularTV(1),
        getTopRatedTV(1),
        getOnTheAir(1),
        getTrending("tv","day"),
        discoverTV({ with_genres: 16, sort_by: "popularity.desc" }),
      ]);
      setPopular((pop.results||[]).map(r=> ({...r, media_type:"tv"})));
      setTopRated((top.results||[]).map(r=> ({...r, media_type:"tv"})));
      setOnAir((air.results||[]).map(r=> ({...r, media_type:"tv"})));
      setTrending((trend.results||[]).map(r=> ({...r, media_type:"tv"})));
      setKids((kidsRes.results||[]).map(r=> ({...r, media_type:"tv"})));
    }
    load();
    window.scrollTo(0,0);
  },[]);

  return (
    <div className="min-h-screen bg-[#080808] pt-[64px] pb-12">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">TV Shows</h1>
        <p className="text-sm text-white/50 mt-1">Binge your favorite series streaming on PRIVA</p>
      </div>
      <MediaRow title="Trending Shows" items={trending} variant="portrait" />
      <MediaRow title="Popular Shows" items={popular} variant="portrait" />
      <MediaRow title="On The Air" items={onAir} variant="portrait" />
      <MediaRow title="Top Rated Series" items={topRated} variant="portrait" />
      <MediaRow title="Animation" items={kids} variant="portrait" />
    </div>
  )
}

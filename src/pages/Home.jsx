import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import MediaRow from "../components/MediaRow";
import BrowseByProvider from "../components/BrowseByProvider";
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies, getNowPlaying, getUpcoming } from "../lib/tmdb";
import { useWatchHistory } from "../context/WatchHistoryContext";

export default function Home() {
  const [heroItems, setHeroItems] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [becauseAnimals, setBecauseAnimals] = useState([]);
  const navigate = useNavigate();
  const { history } = useWatchHistory();

  useEffect(()=> {
    async function load() {
      try {
        const [trendingAll, popMovies, popTV, top, now, up] = await Promise.all([
          getTrending("all","day"),
          getPopularMovies(1),
          getPopularTV(1),
          getTopRatedMovies(1),
          getNowPlaying(1),
          getUpcoming(1),
        ]);

        const hero = (trendingAll.results || []).slice(0,7).map(r=> ({...r, media_type: r.media_type || (r.title ? "movie":"tv") }));
        setHeroItems(hero);
        setTrendingMovies((trendingAll.results || []).filter(r=> r.media_type==="movie"|| r.title).slice(0,10).map(r=> ({...r, media_type:"movie"})));
        setTrendingTV((trendingAll.results || []).filter(r=> r.media_type==="tv"|| r.name).slice(0,10).map(r=> ({...r, media_type:"tv"})));
        setPopularMovies((popMovies.results||[]).map(r=> ({...r, media_type:"movie"})));
        setTopRated((top.results||[]).map(r=> ({...r, media_type:"movie"})));
        setNowPlaying((now.results||[]).map(r=> ({...r, media_type:"movie"})));
        setBecauseAnimals((up.results||[]).map(r=> ({...r, media_type:"movie"})));
      } catch(e){ console.error(e); }
    }
    load();
  }, []);

  useEffect(()=> {
    if(history && history.length>0) {
      setContinueWatching(history.slice(0,10));
    } else {
      if(trendingMovies.length) {
        setContinueWatching(trendingMovies.slice(0,5));
      }
    }
  }, [history, trendingMovies]);

  const progressMap = {};
  if(continueWatching.length) {
    continueWatching.forEach((item,i)=> {
      if(i===0) progressMap[item.id] = { pct: 18, timeLeft: "1hr 25m left" };
      if(i===1) progressMap[item.id] = { pct: 10, timeLeft: "2hr 11m left" };
      if(i===2) progressMap[item.id] = { pct: 22, timeLeft: "1hr 20m left" };
    })
  }

  return (
    <div className="min-h-screen bg-[#080808] pb-12">
      <HeroCarousel items={heroItems} />

      <div className="max-w-[1600px] mx-auto mt-2">
        <MediaRow title="Continue Watching" items={continueWatching} progressMap={progressMap} actionIcon variant="landscape" />
        <BrowseByProvider />
        <MediaRow title="Because you watched Animals" items={becauseAnimals} onTitleClick={()=> navigate("/movie/123")} variant="portrait" />
        <MediaRow title="Trending Today" items={trendingMovies} variant="portrait" />
        <MediaRow title="Top Rated Movies" items={topRated} variant="portrait" />
        <MediaRow title="Popular TV Shows" items={trendingTV} variant="portrait" />
        <MediaRow title="Now Playing" items={nowPlaying} variant="portrait" />
        <MediaRow title="Popular on PRIVA" items={popularMovies} variant="portrait" />
      </div>

      <button onClick={()=> window.scrollTo({top:0, behavior:"smooth"})} className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-[#1a1a1e] border border-white/10 flex items-center justify-center hover:bg-white/10 z-40">
        <span className="text-xs">↑</span>
      </button>
    </div>
  )
}

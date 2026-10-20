import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import MediaRow from "../components/MediaRow";
import BrowseByProvider from "../components/BrowseByProvider";
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies, getNowPlaying, getUpcoming } from "../lib/tmdb";
import { useWatchHistory } from "../context/WatchHistoryContext";
import { useAuth } from "../context/AuthContext";

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
  const { userCode } = useAuth();

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

  // Build Continue Watching from history + progress localStorage, fallback to trending if empty
  useEffect(()=> {
    // If history has items, show them
    if(history && history.length>0) {
      // enhance with media_type
      const enriched = history.slice(0,10);
      setContinueWatching(enriched);
    } else {
      // fallback to some trending as placeholder like screenshot shows Animals etc
      if(trendingMovies.length) {
        // mock progress for demo
        setContinueWatching(trendingMovies.slice(0,5));
      }
    }
  }, [history, trendingMovies]);

  // Mock progress map for Continue Watching
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

      {/* Continue Watching */}
      <div className="max-w-[1600px] mx-auto mt-2">
        <MediaRow title="Continue Watching" items={continueWatching} progressMap={progressMap} actionIcon />
        <BrowseByProvider />
        {/* Because you watched Animals */}
        <MediaRow title="Because you watched Animals" items={becauseAnimals} onTitleClick={()=> navigate("/movie/123")} />
        <MediaRow title="Trending Today" items={trendingMovies} />
        <MediaRow title="Top Rated Movies" items={topRated} />
        <MediaRow title="Popular TV Shows" items={trendingTV} />
        <MediaRow title="Now Playing" items={nowPlaying} />
        <MediaRow title="Popular on PRIVA" items={popularMovies} />
      </div>

      {/* Back to top */}
      <button onClick={()=> window.scrollTo({top:0, behavior:"smooth"})} className="fixed bottom-6 right-6 w-9 h-9 rounded-full bg-[#1a1a1e] border border-white/10 flex items-center justify-center hover:bg-white/10 z-40">
        <span className="text-xs">↑</span>
      </button>
    </div>
  )
}

import { useEffect, useState } from "react";
import { getPopularMovies, getTopRatedMovies, getNowPlaying, getUpcoming, discoverMovies } from "../lib/tmdb";
import MediaRow from "../components/MediaRow";

export default function Movies() {
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [action, setAction] = useState([]);
  const [comedy, setComedy] = useState([]);

  useEffect(()=> {
    async function load(){
      const [pop, top, now, up, act, com] = await Promise.all([
        getPopularMovies(1),
        getTopRatedMovies(1),
        getNowPlaying(1),
        getUpcoming(1),
        discoverMovies({ with_genres: 28, sort_by: "popularity.desc", page: 1 }),
        discoverMovies({ with_genres: 35, sort_by: "popularity.desc", page: 1 }),
      ]);
      setPopular((pop.results||[]).map(r=> ({...r, media_type:"movie"})));
      setTopRated((top.results||[]).map(r=> ({...r, media_type:"movie"})));
      setNowPlaying((now.results||[]).map(r=> ({...r, media_type:"movie"})));
      setUpcoming((up.results||[]).map(r=> ({...r, media_type:"movie"})));
      setAction((act.results||[]).map(r=> ({...r, media_type:"movie"})));
      setComedy((com.results||[]).map(r=> ({...r, media_type:"movie"})));
    }
    load();
  },[]);

  return (
    <div className="min-h-screen bg-[#080808] pt-4 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Movies</h1>
        <p className="text-sm text-white/50 mt-1">Discover thousands of movies streaming on PRIVA</p>
      </div>
      <MediaRow title="Popular Movies" items={popular} />
      <MediaRow title="Now Playing" items={nowPlaying} />
      <MediaRow title="Top Rated" items={topRated} />
      <MediaRow title="Upcoming" items={upcoming} />
      <MediaRow title="Action" items={action} />
      <MediaRow title="Comedy Hits" items={comedy} />
    </div>
  )
}

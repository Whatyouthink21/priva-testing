import { Link } from 'react-router-dom';

const GENRES = [
  { id:35, name:'Comedy', color:'bg-[#1e3a8a]' },
  { id:18, name:'Drama', color:'bg-[#7c3aed]' },
  { id:28, name:'Action', color:'bg-[#dc2626]' },
  { id:27, name:'Horror', color:'bg-[#111827]' },
  { id:10749, name:'Romance', color:'bg-[#be185d]' },
  { id:16, name:'Animation', color:'bg-[#059669]' },
  { id:878, name:'Sci-Fi', color:'bg-[#0e7490]' },
  { id:53, name:'Thriller', color:'bg-[#4338ca]' },
  { id:80, name:'Crime', color:'bg-[#92400e]' },
  { id:9648, name:'Mystery', color:'bg-[#374151]' },
  { id:10751, name:'Family', color:'bg-[#15803d]' },
  { id:14, name:'Fantasy', color:'bg-[#6d28d9]' },
];

export default function GenresRow(){
  return (
    <section className="container-page" data-reveal>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="bingr-section-title">Popular Genres</h2>
        <Link to="/movies" className="text-xs font-semibold text-white/50 hover:text-white">View All</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {GENRES.map(g=>(
          <Link key={g.id} to={`/movies?genre=${g.id}`} className={`group relative h-[72px] overflow-hidden rounded-xl ${g.color} flex items-center justify-center text-white font-bold text-sm hover:scale-[1.02] transition`}>
            <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10" />
            <span className="relative">{g.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

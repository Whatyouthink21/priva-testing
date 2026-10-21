import { Link } from 'react-router-dom';

const LANGS = [
  { code:'en', name:'English', flag:'🇺🇸' },
  { code:'ja', name:'Japanese', flag:'🇯🇵' },
  { code:'ko', name:'Korean', flag:'🇰🇷' },
  { code:'hi', name:'Hindi', flag:'🇮🇳' },
  { code:'es', name:'Spanish', flag:'🇪🇸' },
  { code:'fr', name:'French', flag:'🇫🇷' },
  { code:'de', name:'German', flag:'🇩🇪' },
  { code:'pt', name:'Portuguese', flag:'🇵🇹' },
  { code:'ta', name:'Tamil', flag:'🇮🇳' },
  { code:'te', name:'Telugu', flag:'🇮🇳' },
  { code:'ml', name:'Malayalam', flag:'🇮🇳' },
  { code:'bn', name:'Bengali', flag:'🇧🇩' },
];

export default function LanguagesRow(){
  return (
    <section className="container-page" data-reveal>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="bingr-section-title">Popular Languages</h2>
        <Link to="/movies" className="text-xs font-semibold text-white/50 hover:text-white">View All</Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {LANGS.map(l=>(
          <Link key={l.code} to={`/movies?language=${l.code}`} className="group flex flex-col items-center justify-center gap-1 rounded-xl bg-[#18181b] border border-white/5 py-5 hover:bg-[#202024] hover:border-white/10 transition">
            <span className="text-2xl">{l.flag}</span>
            <span className="text-xs font-medium text-white/70 group-hover:text-white">{l.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

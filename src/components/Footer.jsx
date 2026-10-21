import { Link } from 'react-router-dom';
import Logo from './Logo';

const COLUMNS = [
  { title:'Browse', links:[{to:'/',label:'Home'},{to:'/trending',label:'Trending'},{to:'/movies',label:'Movies'},{to:'/tv',label:'TV Shows'},{to:'/anime',label:'Anime'}]},
  { title:'Account', links:[{to:'/my-list',label:'My List'},{to:'/history',label:'History'},{to:'/settings',label:'Settings'}]},
  { title:'Company', links:[{to:'/about',label:'About'},{to:'/faq',label:'FAQ'},{to:'/contact',label:'Contact'}]},
  { title:'Legal', links:[{to:'/privacy',label:'Privacy'},{to:'/terms',label:'Terms'},{to:'/dmca',label:'DMCA'}]},
];

export default function Footer(){
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0a0a0a]">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.6fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/40">Watch movies, TV shows and anime in one place. Discover trending titles and keep your list synced.</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">TMDB Powered</span>
            </div>
          </div>
          {COLUMNS.map(col=>(
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(l=>(
                  <li key={l.to}><Link to={l.to} className="text-sm text-white/50 hover:text-white">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-white/5 pt-6 flex flex-col sm:flex-row gap-3 justify-between text-xs text-white/30">
          <p>Priva does not host video. All streams are from third-party services.</p>
          <p>© {new Date().getFullYear()} Priva</p>
        </div>
      </div>
    </footer>
  );
}

import { useNavigate } from "react-router-dom";

const providers = [
  { id: 8, name: "Netflix", label: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg", bg: "#000", fallback: "N" },
  { id: 119, name: "Amazon Prime Video", label: "Prime Video", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png", bg: "#00A8E1", fallback: "prime video" },
  { id: 337, name: "Disney Plus", label: "Disney+", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg", bg: "#113CCF" },
  { id: 350, name: "Apple TV+", label: "Apple TV+", logo: "https://upload.wikimedia.org/wikipedia/commons/5/55/Apple_TV_Plus_logo.svg", bg: "#000" },
  { id: 2, name: "Apple TV", label: "Apple TV", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Apple_TV_logo.svg", bg: "#000" },
  { id: 15, name: "Hulu", label: "Hulu", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg", bg: "#1CE783" },
  { id: 1899, name: "Max", label: "Max", logo: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_logo.svg", bg: "#000", fallback: "HBO max" },
  { id: 531, name: "Paramount Plus", label: "Paramount+", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg", bg: "#0064FF" },
  { id: 386, name: "Peacock", label: "Peacock", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Peacock_logo.svg", bg: "#000" },
  { id: 283, name: "Crunchyroll", label: "Crunchyroll", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.png", bg: "#F47521" },
  { id: 43, name: "Starz", label: "Starz", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Starz_logo.svg", bg: "#082125" },
  { id: 34, name: "AMC+", label: "AMC+", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/AMC%2B_logo.svg", bg: "#002244" },
  { id: 453, name: "MGM+", label: "MGM+", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3a/MGM%2B_logo.svg", bg: "#000" },
];

function ProviderIcon({ p }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[74px] md:min-w-[84px]">
      <div className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden p-2.5" style={{ background: p.bg }}>
        <img
          src={p.logo}
          alt={p.name}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e)=> {
            e.currentTarget.style.display='none';
            e.currentTarget.nextElementSibling.style.display='flex';
          }}
        />
        <span style={{display:'none'}} className="text-white font-black text-[12px] text-center leading-none">{p.fallback || p.name}</span>
      </div>
      <span className="text-[11px] text-white/60 text-center leading-tight max-w-[80px] line-clamp-2">{p.label}</span>
    </div>
  )
}

export default function BrowseByProvider() {
  const navigate = useNavigate();
  return (
    <section className="py-6">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <h2 className="text-[16px] md:text-[19px] font-semibold tracking-tight mb-4">Browse by Provider</h2>
        <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
          {providers.map(p=> (
            <button key={p.id} onClick={()=> navigate(`/provider/${p.id}?name=${encodeURIComponent(p.name)}`)} className="shrink-0 hover:scale-105 transition-transform duration-200">
              <ProviderIcon p={p} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
export { providers }

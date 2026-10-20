import { useNavigate } from "react-router-dom";

const providers = [
  { id: 8, name: "Netflix", abbr: "N", bg: "#E50914", label: "Netflix" },
  { id: 119, name: "Amazon Prime Video", abbr: "prime video", bg: "#00A8E1", label: "Amazon Prime\nVideo" },
  { id: 337, name: "Disney Plus", abbr: "Disney+", bg: "#0A0B3F", label: "Disney Plus" },
  { id: 350, name: "Apple TV+", abbr: "tv+", bg: "#000000", label: "Apple TV+" },
  { id: 2, name: "Apple TV", abbr: "tv", bg: "#000000", label: "Apple TV" },
  { id: 15, name: "Hulu", abbr: "hulu", bg: "#1CE783", label: "Hulu" },
  { id: 1899, name: "HBO Max", abbr: "HBO max", bg: "#000000", label: "HBO Max" },
  { id: 531, name: "Paramount Plus", abbr: "P+", bg: "#0064FF", label: "Paramount Plus" },
  { id: 386, name: "Peacock Premium", abbr: "peacock", bg: "#000000", label: "Peacock\nPremium" },
  { id: 283, name: "Crunchyroll", abbr: "Crunchyroll", bg: "#FF6B00", label: "Crunchyroll" },
  { id: 43, name: "Starz", abbr: "STARZ", bg: "#000000", label: "Starz" },
  { id: 34, name: "AMC+", abbr: "AMC+", bg: "#0A0B3F", label: "AMC+" },
  { id: 453, name: "MGM+", abbr: "MGM+", bg: "#000000", label: "MGM Plus" },
  { id: 77, name: "Star Plus", abbr: "STAR", bg: "#E50914", label: "MGM" },
];

function ProviderIcon({ p }) {
  const styleFor = (name) => {
    if(name==="Netflix") return "bg-[#E50914] text-white font-black text-[28px]";
    if(name==="Amazon Prime Video") return "bg-[#00A8E1] text-white font-bold text-[11px] leading-none";
    if(name==="Disney Plus") return "bg-[#0A0B3F] text-white font-bold text-[10px]";
    if(name==="Apple TV+" || name==="Apple TV") return "bg-black text-white font-semibold text-[12px]";
    if(name==="Hulu") return "bg-[#1CE783] text-black font-black text-[16px]";
    if(name==="HBO Max") return "bg-black text-white font-black text-[12px]";
    if(name==="Paramount Plus") return "bg-[#0064FF] text-white font-bold text-[9px]";
    if(name==="Peacock Premium") return "bg-black text-white font-bold text-[9px]";
    if(name==="Crunchyroll") return "bg-[#FF6B00] text-white font-bold text-[10px]";
    if(name==="Starz") return "bg-black text-white font-black text-[12px]";
    if(name==="AMC+") return "bg-[#0A2540] text-white font-bold text-[10px]";
    return "bg-[#111] text-white text-[10px]";
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-[84px]">
      <div className={`w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden ${styleFor(p.name)}`} style={{ background: p.bg }}>
        {p.name==="Netflix" && <span className="font-black text-[30px]">N</span>}
        {p.name==="Amazon Prime Video" && <div className="text-center leading-none"><div className="text-[11px] font-black">prime</div><div className="text-[11px] font-black">video</div><div className="text-[7px] mt-0.5">↳</div></div>}
        {p.name==="Disney Plus" && <span className="font-bold italic">Disney+</span>}
        {(p.name==="Apple TV+" || p.name==="Apple TV") && <span className="flex items-center gap-1"> tv</span>}
        {p.name==="Hulu" && <span>hulu</span>}
        {p.name==="HBO Max" && <div className="text-center leading-none"><div className="text-[11px]">HBO</div><div className="text-[9px]">max</div></div>}
        {p.name==="Paramount Plus" && <div className="text-center"><div className="text-[7px]">Paramount+</div></div>}
        {p.name==="Peacock Premium" && <span className="text-[8px]">peacock</span>}
        {p.name==="Crunchyroll" && <span className="text-[10px]">◎</span>}
        {p.name==="Starz" && <span>STARZ</span>}
        {p.name==="AMC+" && <span>amc+</span>}
        {p.name==="MGM+" && <span>MGM+</span>}
        {p.name==="MGM" && <span>MGM</span>}
        {p.name==="Star Plus" && <span>Star</span>}
      </div>
      <span className="text-[11px] text-white/60 text-center leading-tight whitespace-pre-line">{p.label}</span>
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
            <button key={p.id} onClick={()=> navigate(`/provider/${p.id}?name=${encodeURIComponent(p.name)}`)} className="shrink-0 hover:opacity-90 transition-opacity">
              <ProviderIcon p={p} />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
export { providers }

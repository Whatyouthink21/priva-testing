import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBar({ initialValue="", onSearch, placeholder="Search movies, TV shows & people..." }) {
  const [q,setQ] = useState(initialValue);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if(!q.trim()) return;
    if(onSearch) onSearch(q);
    else navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} className="relative w-full max-w-[640px] mx-auto">
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          value={q}
          onChange={(e)=> setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 rounded-full bg-white/5 border border-white/10 pl-11 pr-4 text-sm placeholder:text-white/40 focus:outline-none focus:border-white/20 focus:bg-white/[0.07]"
        />
      </div>
    </form>
  )
}

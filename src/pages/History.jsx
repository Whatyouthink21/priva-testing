import { useWatchHistory } from "../context/WatchHistoryContext";
import MediaCard from "../components/MediaCard";
import { Link } from "react-router-dom";
import { Clock, Trash2 } from "lucide-react";

export default function History() {
  const { history, clearHistory } = useWatchHistory();

  if(history.length===0) {
    return (
      <div className="min-h-screen bg-[#080808] pt-6">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock size={20}/> Watch History</h1>
          <div className="mt-12 flex flex-col items-center justify-center py-16 text-center bg-[#111]/50 rounded-2xl border border-white/5">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4"><Clock size={20} className="opacity-50"/></div>
            <h3 className="font-semibold">No watch history yet</h3>
            <p className="text-sm text-white/50 mt-1">Movies and shows you watch will appear here.</p>
            <Link to="/" className="mt-6 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm">Start watching</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-6 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock size={20}/> Watch History <span className="text-white/30 text-base font-normal">({history.length})</span></h1>
          <button onClick={clearHistory} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm flex items-center gap-2 hover:bg-white/10"><Trash2 size={14}/> Clear</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
          {history.map(item=> (
            <div key={`${item.media_type}-${item.id}-${item.watchedAt}`} className="relative">
              <MediaCard item={item} />
              <div className="text-[11px] text-white/40 mt-1 px-1">{new Date(item.watchedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

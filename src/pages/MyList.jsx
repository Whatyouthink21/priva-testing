import { useList } from "../context/ListContext";
import MediaCard from "../components/MediaCard";
import { Link } from "react-router-dom";

export default function MyList() {
  const { myList } = useList();

  if(myList.length===0) {
    return (
      <div className="min-h-screen bg-[#080808] pt-10 pb-12">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8">
          <h1 className="text-2xl font-bold">My List</h1>
          <div className="mt-12 flex flex-col items-center justify-center py-20 text-center bg-[#111]/50 rounded-2xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">♡</div>
            <h3 className="font-semibold">Your list is empty</h3>
            <p className="text-sm text-white/50 mt-1 max-w-[420px]">Add movies and shows to your list by clicking the + button on any title.</p>
            <Link to="/" className="mt-6 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm">Browse titles</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-6 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <h1 className="text-2xl font-bold">My List <span className="text-white/30 text-lg font-normal">({myList.length})</span></h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4 mt-6">
          {myList.map(item=> (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} showMeta />
          ))}
        </div>
      </div>
    </div>
  )
}

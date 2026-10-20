import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Shield, Monitor, Palette, HardDrive, Server } from "lucide-react";

export default function Settings() {
  const { isLoggedIn, userCode, logout } = useAuth();
  const [defaultServer, setDefaultServer] = useState(()=> localStorage.getItem("priva_default_server") || "tgvid");

  useEffect(()=> { window.scrollTo(0,0); }, []);

  const handleServerChange = (val) => {
    setDefaultServer(val);
    localStorage.setItem("priva_default_server", val);
  };

  return (
    <div className="min-h-screen bg-[#080808] pt-[64px] pb-12">
      <div className="max-w-[800px] mx-auto px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-white/50 mt-1">Manage your PRIVA experience</p>

        <div className="mt-8 space-y-6">
          <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-5">
            <h3 className="font-semibold flex items-center gap-2"><Shield size={16}/> Account</h3>
            <div className="mt-4">
              {isLoggedIn ? (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <div className="text-sm font-medium">Signed in</div>
                    <div className="text-xs text-white/50">5-digit code: <span className="font-mono font-bold tracking-widest text-white">{userCode}</span></div>
                  </div>
                  <button onClick={logout} className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium flex items-center gap-2 hover:bg-red-600"><LogOut size={14}/> Logout</button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="text-sm font-medium">Not signed in</div>
                  <div className="text-xs text-white/50 mt-1">Create a 5-digit code to save your list and history in Firestore (priva-movies).</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-5">
            <h3 className="font-semibold flex items-center gap-2"><Server size={16}/> Streaming Server</h3>
            <p className="text-xs text-white/50 mt-1">Choose your default streaming provider. You can switch anytime in the player.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={()=> handleServerChange("tgvid")} className={`p-4 rounded-xl border text-left transition-colors ${defaultServer==="tgvid" ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}>
                <div className="font-semibold text-sm">Server 1</div>
                <div className="text-xs opacity-60 mt-1">TGVID — Primary, fast, multi-audio</div>
                {defaultServer==="tgvid" && <div className="text-xs font-bold mt-2">✓ Default</div>}
              </button>
              <button onClick={()=> handleServerChange("vidstuck")} className={`p-4 rounded-xl border text-left transition-colors ${defaultServer==="vidstuck" ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10 text-white"}`}>
                <div className="font-semibold text-sm">Server 2</div>
                <div className="text-xs opacity-60 mt-1">VidStuck — Backup, stable</div>
                {defaultServer==="vidstuck" && <div className="text-xs font-bold mt-2">✓ Default</div>}
              </button>
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-5">
            <h3 className="font-semibold flex items-center gap-2"><Monitor size={16}/> Playback</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Autoplay next episode", desc: "Automatically play the next episode in a series", defaultOn: true },
                { label: "Skip intro / recap", desc: "Show skip buttons for intros and recaps", defaultOn: true },
                { label: "Highest quality by default", desc: "Prefer 1080p when available", defaultOn: false },
              ].map(item=> (
                <label key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer">
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-white/50">{item.desc}</div>
                  </div>
                  <input type="checkbox" defaultChecked={item.defaultOn} className="w-9 h-5 rounded-full appearance-none bg-white/15 checked:bg-white relative after:absolute after:w-4 after:h-4 after:bg-white after:checked:bg-black after:rounded-full after:top-0.5 after:left-0.5 after:checked:translate-x-4 after:transition-all" />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-5">
            <h3 className="font-semibold flex items-center gap-2"><Palette size={16}/> Appearance</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white text-black text-center font-semibold border">Dark (Default)</div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-white/50">Light (Soon)</div>
            </div>
          </div>

          <div className="bg-[#0f0f0f] rounded-2xl border border-white/10 p-5">
            <h3 className="font-semibold flex items-center gap-2"><HardDrive size={16}/> Storage</h3>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-sm">PRIVA stores your continue-watching and My List locally, and your 5-digit code in Firestore (priva-movies).</div>
              <button onClick={()=> { localStorage.clear(); location.reload(); }} className="mt-3 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm hover:bg-white/15">Clear local data</button>
            </div>
          </div>

          <div className="text-center text-xs text-white/20 pt-6">
            PRIVA • Version 1.0 • Built with TMDB • Streaming via Server 1 & Server 2
          </div>
        </div>
      </div>
    </div>
  )
}

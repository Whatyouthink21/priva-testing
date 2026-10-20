import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Settings, Menu, X, LogOut, Clock, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function PrivaLogo({ size=28 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-black text-[16px] leading-none tracking-tighter">P</span>
          <div className="w-0 h-0 ml-[1px] border-l-[6px] border-l-black border-y-[4px] border-y-transparent"></div>
        </div>
        <div className="absolute bottom-[3px] right-[4px] w-[6px] h-[2px] bg-black rounded-full opacity-60"></div>
      </div>
      <span className="font-black text-[19px] tracking-[-0.03em]">PRIVA</span>
    </div>
  )
}

export default function Navbar({ onOpenAuth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, userCode, logout } = useAuth();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(()=> {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return ()=> window.removeEventListener("scroll", onScroll);
  },[]);

  useEffect(()=> { setShowSettingsDropdown(false); setMobileMenu(false); }, [location.pathname]);

  const navItems = [
    { label: "Home", path: "/", icon: "⌂" },
    { label: "Movies", path: "/movies" },
    { label: "Shows", path: "/shows" },
    { label: "My List", path: "/my-list" },
  ];

  const isActive = (p) => location.pathname === p;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}>
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="h-[56px] md:h-[64px] flex items-center justify-between gap-4">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <PrivaLogo />
            </Link>

            {/* Center nav - desktop */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#1a1a1e]/90 backdrop-blur-xl rounded-full p-1 border border-white/10">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-5 py-[7px] rounded-full text-[13px] font-medium transition-all ${isActive(item.path) ? "bg-white text-black" : "text-white/80 hover:text-white hover:bg-white/10"}`}
                >
                  {item.label === "Home" && <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>{item.label}</span>}
                  {item.label !== "Home" && item.label}
                </Link>
              ))}
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button onClick={()=> navigate("/search")} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                <Search size={15} className="text-white/80" />
              </button>
              <div className="relative">
                <button onClick={()=> setShowSettingsDropdown(v=>!v)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">
                  <Settings size={15} className="text-white/80" />
                </button>
                {showSettingsDropdown && (
                  <div className="absolute right-0 top-[44px] w-[220px] bg-[#111113] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-2">
                      {!isLoggedIn ? (
                        <button onClick={()=> { setShowSettingsDropdown(false); onOpenAuth("register"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors">
                          <LogIn size={16} className="opacity-60" /> Login / Register
                        </button>
                      ) : (
                        <div className="px-3 py-2">
                          <div className="text-xs text-white/50">Signed in as</div>
                          <div className="text-sm font-mono font-semibold tracking-widest">{userCode}</div>
                        </div>
                      )}
                      <button onClick={()=> { setShowSettingsDropdown(false); navigate("/settings"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors">
                        <Settings size={16} className="opacity-60" /> Settings
                      </button>
                      <button onClick={()=> { setShowSettingsDropdown(false); navigate("/history"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors">
                        <Clock size={16} className="opacity-60" /> Watch History
                      </button>
                      {isLoggedIn && (
                        <button onClick={()=> { logout(); setShowSettingsDropdown(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-sm text-white/90 transition-colors">
                          <LogOut size={16} className="opacity-60" /> Logout
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right - mobile */}
            <div className="flex lg:hidden items-center gap-2">
              <button onClick={()=> navigate("/search")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Search size={16} />
              </button>
              <button onClick={()=> setMobileMenu(v=>!v)} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">
                {mobileMenu ? <X size={16}/> : <Menu size={16}/>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="lg:hidden bg-[#0a0a0c] border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <div className="flex gap-2">
                {navItems.map(item=> (
                  <Link key={item.path} to={item.path} className={`flex-1 text-center py-2.5 rounded-full text-sm font-medium ${isActive(item.path) ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <button onClick={()=> { onOpenAuth(isLoggedIn? "settings":"register"); setMobileMenu(false); }} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-sm">
                  <Settings size={16}/> {isLoggedIn ? `Code: ${userCode}` : "Login"}
                </button>
                <Link to="/history" onClick={()=>setMobileMenu(false)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 text-sm">
                  <Clock size={16}/> History
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
      <div className="h-[56px] md:h-[64px]" />
    </>
  )
}
export { PrivaLogo }

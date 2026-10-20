import { useState, useEffect } from "react";
import { X, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose, initialTab="register" }) {
  const [tab, setTab] = useState(initialTab);
  const [codeInput, setCodeInput] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [turnstileDone, setTurnstileDone] = useState(false); // mock verification
  const { register, login, loading, error, setError } = useAuth();

  useEffect(()=> { if(isOpen) setTab(initialTab); }, [isOpen, initialTab]);

  useEffect(()=> {
    if(isOpen) {
      setTurnstileDone(false);
      const t = setTimeout(()=> setTurnstileDone(true), 1200);
      return ()=> clearTimeout(t);
    }
  }, [isOpen]);

  if(!isOpen) return null;

  const handleGenerate = async () => {
    if(!turnstileDone) {
      setError("Please complete verification");
      return;
    }
    const code = await register();
    if(code) {
      setGenerated(code);
      setTimeout(()=> {
        onClose();
        setGenerated(null);
        setCodeInput("");
      }, 2000);
    }
  };

  const handleLogin = async () => {
    if(codeInput.length !== 5) {
      setError("Code must be 5 digits");
      return;
    }
    const ok = await login(codeInput);
    if(ok) {
      onClose();
      setCodeInput("");
    }
  };

  // fake turnstile verification after 1.5s
  // UseEffect simulation: when modal opens, auto verify after short delay
  // We will simulate with a timer in UI
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-[#0e0e10] rounded-[24px] border border-white/10 overflow-hidden shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
          <X size={16} />
        </button>

        <div className="px-6 pt-10 pb-6 md:px-8 md:pt-10">
          <div className="flex flex-col items-center text-center">
            {/* PRIVA icon */}
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4">
              <span className="font-black text-black">P</span>
              <span className="ml-1 w-0 h-0 border-l-[8px] border-l-black border-y-[5px] border-y-transparent"></span>
            </div>
            <h2 className="text-[20px] font-bold">{tab==="register" ? "Create your account" : "Welcome back"}</h2>
            <p className="text-sm text-white/50 mt-1">{tab==="register" ? "Create your 5-digit account code" : "Enter your 5-digit account code"}</p>
          </div>

          <div className="mt-6 bg-[#1a1a1e] rounded-full p-1 flex">
            <button onClick={()=> { setTab("login"); setError(null); }} className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${tab==="login" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}>Sign In</button>
            <button onClick={()=> { setTab("register"); setError(null); }} className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${tab==="register" ? "bg-white text-black" : "text-white/60 hover:text-white"}`}>Register</button>
          </div>

          {tab==="register" ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="w-12 h-12 rounded-full bg-[#1f1f23] flex items-center justify-center border border-white/10">
                  <KeyRound size={20} className="opacity-70" />
                </div>
                {generated ? (
                  <div className="text-center">
                    <div className="text-xs text-white/50">Your 5-digit code</div>
                    <div className="text-3xl font-mono font-black tracking-[0.3em] mt-1">{generated}</div>
                    <div className="text-xs text-emerald-400 mt-2">Saved! Keep it safe.</div>
                  </div>
                ) : (
                  <p className="text-sm text-white/60 text-center leading-relaxed max-w-[280px]">
                    We'll make you a random <span className="text-white font-semibold">5-digit code</span>. That's your only login, so keep it somewhere safe.
                  </p>
                )}
              </div>

              {!generated && (
                <>
                  <div className="bg-[#1a1a1e] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${turnstileDone ? "border-emerald-500 bg-emerald-500" : "border-white/20"}`}>
                        {turnstileDone && <span className="text-[10px] text-black">✓</span>}
                      </div>
                      <span className="text-white/70 text-xs">{turnstileDone ? "Verified" : "Verifying..."}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-white/60 tracking-widest">CLOUDFLARE</div>
                      <div className="text-[8px] text-white/30">Privacy • Terms</div>
                    </div>
                  </div>
                  {!turnstileDone && (
                    <div className="w-full text-xs text-white/30 text-center py-1">Verifying you are human...</div>
                  )}
                  {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
                  <button onClick={handleGenerate} disabled={loading} className="w-full h-11 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-50 flex items-center justify-center">
                    {loading ? "Generating..." : "Generate my code"}
                  </button>
                  <p className="text-[11px] text-white/30 text-center">Stored securely in Firestore</p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="relative">
                <input
                  value={codeInput}
                  onChange={(e)=> { const v=e.target.value.replace(/\D/g,"").slice(0,5); setCodeInput(v); setError(null); }}
                  placeholder="Enter your 5-digit code"
                  className="w-full h-11 rounded-full bg-[#1a1a1e] border border-white/10 pl-4 pr-10 text-sm placeholder:text-white/40 focus:outline-none focus:border-white/20 text-center tracking-[0.4em] font-mono"
                  type={showCode ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={5}
                />
                <button type="button" onClick={()=> setShowCode(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                  {showCode ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
              <button onClick={handleLogin} disabled={loading || codeInput.length!==5} className="w-full h-11 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 disabled:opacity-40">
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <div className="text-center">
                <button onClick={()=> setTab("register")} className="text-xs text-white/50 hover:text-white">Don't have a code? Register</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

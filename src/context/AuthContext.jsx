import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithCode, verifyCodeExists, generate5DigitCode } from "../lib/firebase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [userCode, setUserCode] = useState(() => localStorage.getItem("priva_code") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userCode) localStorage.setItem("priva_code", userCode);
    else localStorage.removeItem("priva_code");
  }, [userCode]);

  const register = async () => {
    setLoading(true); setError(null);
    let attempts = 0;
    while (attempts < 10) {
      const code = generate5DigitCode();
      try {
        const ok = await createUserWithCode(code);
        if (ok) {
          setUserCode(code);
          setLoading(false);
          return code;
        }
      } catch (e) {
        setError(e.message);
        setLoading(false);
        return null;
      }
      attempts++;
    }
    setError("Could not generate unique code, try again");
    setLoading(false);
    return null;
  };

  const login = async (code) => {
    setLoading(true); setError(null);
    try {
      const exists = await verifyCodeExists(code);
      if (!exists) {
        setError("Invalid code — not found");
        setLoading(false);
        return false;
      }
      setUserCode(code);
      setLoading(false);
      return true;
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUserCode(null);
    localStorage.removeItem("priva_code");
  };

  return (
    <AuthContext.Provider value={{ userCode, isLoggedIn: !!userCode, register, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

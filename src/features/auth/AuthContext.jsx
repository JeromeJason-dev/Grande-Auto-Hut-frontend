import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setOnAuthLost } from "../../api/client";
import * as authApi from "../../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    setOnAuthLost(clearSession);
  }, [clearSession]);

  // On first load there's no access token in memory yet (a hard refresh
  // clears JS memory). fetchMe() will 401 with no Authorization header;
  // client.js's response interceptor catches that, silently refreshes off
  // the httpOnly cookie, and retries this same request - so we don't call
  // any explicit refresh() here, we just ask for the user and let the
  // interceptor do its job.
  useEffect(() => {
    (async () => {
      try {
        const me = await authApi.fetchMe();
        setUser(me);
        setStatus("authenticated");
      } catch {
        clearSession();
      }
    })();
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    await authApi.login(email, password);
    const me = await authApi.fetchMe();
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    await authApi.register(payload);
    const me = await authApi.fetchMe();
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const me = await authApi.fetchMe();
    setUser(me);
    return me;
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
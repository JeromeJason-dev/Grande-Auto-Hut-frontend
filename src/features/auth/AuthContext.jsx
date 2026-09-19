import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL, setAccessToken, setOnAuthLost } from "../../api/client";
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

  // On first load, there's no access token in memory yet (a hard refresh
  // clears JS memory) - try the httpOnly refresh cookie silently before
  // deciding the person is logged out.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {}, { withCredentials: true });
        setAccessToken(data.access);
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

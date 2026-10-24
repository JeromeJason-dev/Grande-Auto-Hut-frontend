import { useLocation } from "react-router-dom";


export function useBasePath() {
  const { pathname } = useLocation();
  return pathname === "/staff" || pathname.startsWith("/staff/") ? "/staff" : "/admin";
}

/** Home path of the back-office area for a given role. */
export const homeForRole = (role) => (role === "staff" ? "/staff" : "/admin");
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";


// Staff pages that have an admin counterpart at the same sub-path.
const SHARED_SUBPATHS = /^\/(products|orders|reviews|tickets(\/[^/]+)?|fitment|account)\/?$/;
export default function RoleGate({ area, children }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();

  if (!user || user.role === "customer") return <Navigate to="/" replace />;

  if (area === "admin" && user.role !== "admin") {
    const target = pathname.replace(/^\/admin\/staff\/?$/, "/staff").replace(/^\/admin/, "/staff");
    return <Navigate to={`${target}${search}`} replace />;
  }

  if (area === "staff" && user.role === "admin") {
    const sub = pathname.replace(/^\/staff/, "") || "/";
    const target = SHARED_SUBPATHS.test(sub) ? `/admin${sub}` : "/admin";
    return <Navigate to={`${target}${target === "/admin" ? "" : search}`} replace />;
  }
  return children;
}
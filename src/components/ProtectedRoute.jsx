import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children, staffOnly = false }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <div className="container"><Spinner label="Checking your session" /></div>;
  if (status === "anonymous") return <Navigate to="/login" state={{ from: location }} replace />;
  if (staffOnly && user?.role === "customer") return <Navigate to="/" replace />;
  return children;
}

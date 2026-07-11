import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a page. If nobody's logged in, bounce to /login.
// If `roles` is given and the user's role isn't in it, bounce to /.
export default function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loader">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

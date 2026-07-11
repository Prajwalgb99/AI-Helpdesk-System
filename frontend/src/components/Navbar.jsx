import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Linear-style left sidebar rather than a top navbar — stays put,
// scales cleanly as we add more nav items per role.
export default function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">D</span>
        <span className="sidebar-brand-name">Deskline</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          Tickets
        </NavLink>
        {user.role === "admin" && (
          <>
            <NavLink to="/teams" className="sidebar-link">
              Teams
            </NavLink>
            <NavLink to="/users" className="sidebar-link">
              Users
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user.name?.[0]}</div>
          <div>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-small" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}

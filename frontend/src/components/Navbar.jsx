import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Header style top navbar - replaces vertical sidebar layout
export default function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-brand">
            <span className="navbar-brand-mark">D</span>
            <span className="navbar-brand-name">Deskline</span>
          </div>

          <nav className="navbar-nav">
            <NavLink to="/" end className="navbar-link">
              Tickets
            </NavLink>
            {user.role === "admin" && (
              <>
                <NavLink to="/teams" className="navbar-link">
                  Teams
                </NavLink>
                <NavLink to="/users" className="navbar-link">
                  Users
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="navbar-right">
          <div className="navbar-user">
            <div className="navbar-user-avatar">{user.name?.[0]}</div>
            <div className="navbar-user-info">
              <div className="navbar-user-name">{user.name}</div>
              <div className="navbar-user-role">{user.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-small" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

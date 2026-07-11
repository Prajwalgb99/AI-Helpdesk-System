import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserDashboard from "./pages/UserDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManageTeams from "./pages/ManageTeams";
import ManageUsers from "./pages/ManageUsers";
import TicketDetail from "./pages/TicketDetail";

// The "/" route renders a different dashboard component depending on
// role. Keeping that branch here (rather than three separate routes)
// means the URL structure stays the same for every role.
function Home() {
  const { user } = useAuth();
  if (user.role === "admin") return <AdminDashboard />;
  if (user.role === "agent") return <AgentDashboard />;
  return <UserDashboard />;
}

export default function App() {
  return (
    <Routes>
      {/* Auth pages render standalone — full-bleed dark background,
          no sidebar, no dashboard padding around them. */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Everything else renders inside the dashboard shell. */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <DashboardShell />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function DashboardShell() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route
            path="/teams"
            element={
              <PrivateRoute roles={["admin"]}>
                <ManageTeams />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute roles={["admin"]}>
                <ManageUsers />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

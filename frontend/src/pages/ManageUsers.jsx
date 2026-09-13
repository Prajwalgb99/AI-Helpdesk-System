import { useEffect, useState } from "react";
import api from "../utils/api";
import { useConfirm } from "../context/ConfirmContext";
import { useAuth } from "../context/AuthContext";

export default function ManageUsers() {
  const confirm = useConfirm();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.get("/users");
    setUsers(res.data.users);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (id, role) => {
    await api.patch(`/users/${id}`, { role });
    loadUsers();
  };

  const removeUser = async (id, name) => {
    const ok = await confirm(
      `This will permanently delete ${name}'s account and remove them from any team. This can't be undone.`
    );
    if (!ok) return;
    await api.delete(`/users/${id}`);
    loadUsers();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">
            Promote users to agent or admin, or remove accounts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="page-loader">Loading users…</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Team</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = Boolean(
                (currentUser?._id && String(u._id) === String(currentUser._id)) ||
                (currentUser?.email && u.email?.toLowerCase() === currentUser.email?.toLowerCase())
              );

              return (
                <tr key={u._id}>
                  <td>
                    {u.name}
                    {isSelf && (
                      <span className="table-hint" style={{ marginLeft: "8px" }}>
                        (You)
                      </span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {isSelf ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 4px",
                          fontWeight: 500,
                          fontSize: "13.5px",
                          color: "var(--text-primary)",
                          textTransform: "capitalize",
                        }}
                      >
                        {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u._id, e.target.value)}
                        className="table-select"
                      >
                        <option value="user">User</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td>{u.team?.name || "—"}</td>
                  <td>
                    {isSelf ? (
                      <span className="table-hint">—</span>
                    ) : (
                      <button
                        className="btn btn-ghost btn-small"
                        onClick={() => removeUser(u._id, u.name)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

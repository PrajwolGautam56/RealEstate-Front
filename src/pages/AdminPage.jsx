import { useEffect, useState } from "react";
import { api } from "../api";
import Spinner from "../components/Spinner";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "agent",
};

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState({ clients: [], properties: [] });
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: usersData }, { data: activityData }] = await Promise.all([
      api.get("/users"),
      api.get("/users/activity/all"),
    ]);
    setUsers(usersData);
    setActivity(activityData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addUser = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setForm(initialForm);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add user");
    }
  };

  const deactivateUser = async (id) => {
    if (!window.confirm("Deactivate this agent?")) return;
    await api.patch(`/users/${id}/deactivate`);
    await load();
  };

  if (loading) return <Spinner label="Loading admin data..." />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin panel</h1>

      <section className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-3 text-lg font-semibold">Add new agent</h2>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={addUser}>
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
          <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required />
          <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}>
            <option value="agent">agent</option>
            <option value="admin">admin</option>
          </select>
          <div className="md:col-span-4">
            <button className="min-h-11 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">Create user</button>
          </div>
          {error ? <p className="text-sm text-red-600 md:col-span-4">{error}</p> : null}
        </form>
      </section>

      <section className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur">
        <h2 className="mb-3 text-lg font-semibold">All users</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user._id} className="flex items-center justify-between rounded border border-slate-200 p-3">
              <div>
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-600">{user.email} • {user.role} • {user.isActive ? "Active" : "Inactive"}</p>
              </div>
              {user.isActive ? (
                <button className="min-h-11 rounded bg-red-100 px-3 py-2 text-xs font-medium text-red-700" onClick={() => deactivateUser(user._id)}>
                  Deactivate
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold">All client activity</h2>
          <div className="space-y-2 text-sm">
            {activity.clients.map((item) => (
              <div key={item._id} className="rounded border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-slate-600">Created by: {item.createdBy?.name || "-"}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold">All property activity</h2>
          <div className="space-y-2 text-sm">
            {activity.properties.map((item) => (
              <div key={item._id} className="rounded border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="text-slate-600">Created by: {item.createdBy?.name || "-"}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

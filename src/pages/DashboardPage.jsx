import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Spinner from "../components/Spinner";

const followUpStatuses = ["FB Lead", "Intake"];

export default function DashboardPage() {
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: clientsData }, { data: propertiesData }] = await Promise.all([
        api.get("/clients"),
        api.get("/properties"),
      ]);
      setClients(clientsData);
      setProperties(propertiesData);
      setLoading(false);
    };
    load();
  }, []);

  const buyers = useMemo(() => clients.filter((item) => item.type === "Buyer" || item.type === "Both").length, [clients]);
  const sellers = useMemo(() => clients.filter((item) => item.type === "Seller" || item.type === "Both").length, [clients]);
  const statusCounts = useMemo(
    () =>
      properties.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {}),
    [properties]
  );

  const monthStart = useMemo(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }, []);
  const leadsThisMonth = useMemo(
    () => clients.filter((item) => new Date(item.createdAt) >= monthStart).length,
    [clients, monthStart]
  );

  const recentClients = useMemo(
    () =>
      [...clients]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [clients]
  );
  const recentProperties = useMemo(
    () =>
      [...properties]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [properties]
  );

  const followUps = useMemo(() => {
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return clients.filter((client) => {
      const isFollowUpStatus = followUpStatuses.includes(client.status);
      const stale = now - new Date(client.updatedAt).getTime() > threeDaysMs;
      return isFollowUpStatus && stale;
    });
  }, [clients]);

  if (loading) return <Spinner label="Loading dashboard..." />;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total properties" value={properties.length} />
        <MetricCard label="Total clients" value={`${clients.length} (${buyers} buyers / ${sellers} sellers)`} />
        <MetricCard
          label="Properties by status"
          value={Object.entries(statusCounts).map(([key, value]) => `${key}: ${value}`).join(" | ") || "No data"}
        />
        <MetricCard label="Leads this month" value={leadsThisMonth} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold">Last 5 clients added</h2>
          <div className="space-y-2 text-sm">
            {recentClients.map((client) => (
              <div key={client._id} className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="font-medium text-slate-900">{client.name}</p>
                <p className="text-slate-600">{client.type} • {client.source || "-"}</p>
                <p className="text-slate-600">{client.status} • {new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg backdrop-blur">
          <h2 className="mb-3 text-lg font-semibold">Last 5 properties added</h2>
          <div className="space-y-2 text-sm">
            {recentProperties.map((property) => (
              <div key={property._id} className="rounded-xl border border-slate-100 bg-white p-3">
                <p className="font-medium text-slate-900">{property.name}</p>
                <p className="text-slate-600">{property.locationType?.district || "-"}, {property.locationType?.municipality || "-"}</p>
                <p className="text-slate-600">{property.status} • {new Date(property.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-amber-300/70 bg-linear-to-r from-amber-50 to-orange-50 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold text-amber-800">Follow-up reminders</h2>
        {!followUps.length ? (
          <p className="text-sm text-amber-700">No pending reminders.</p>
        ) : (
          <div className="space-y-2">
            {followUps.map((client) => (
              <div key={client._id} className="flex items-center justify-between rounded border border-amber-200 bg-white p-3">
                <div>
                  <p className="font-medium text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-600">{client.contactNo} • {client.assignedAgent?.name || "-"}</p>
                </div>
                <a
                  href={`https://wa.me/${String(client.contactNo || "").replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center rounded bg-green-600 px-3 py-2 text-xs font-medium text-white"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

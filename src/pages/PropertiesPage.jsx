import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { provinces } from "../data/nepalLocations";
import Spinner from "../components/Spinner";

const statusColors = {
  "FB Lead": "bg-blue-100 text-blue-700",
  Intake: "bg-amber-100 text-amber-700",
  "Property Added/Requirement Taken": "bg-purple-100 text-purple-700",
  "Property Sold": "bg-green-100 text-green-700",
};

const propertyTypes = ["", "Land", "House", "Apartment", "Commercial", "Other"];
const statuses = ["", "FB Lead", "Intake", "Property Added/Requirement Taken", "Property Sold"];

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    propertyId: "",
    province: "",
    district: "",
    municipality: "",
    vdc: "",
    propertyType: "",
    status: "",
    assignedAgent: "",
  });

  const fetchAgents = async () => {
    const { data } = await api.get("/users/agents");
    setAgents(data);
  };

  const fetchProperties = async () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    const { data } = await api.get("/properties", { params });
    setProperties(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [filters.search, filters.propertyId, filters.province, filters.district, filters.municipality, filters.vdc, filters.propertyType, filters.status, filters.assignedAgent]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    await api.delete(`/properties/${id}`);
    fetchProperties();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Properties</h1>
          <p className="text-sm text-slate-600">{properties.length} properties</p>
        </div>
        <Link to="/properties/new" className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200">
          Add Property
        </Link>
      </div>

      <button
        className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm md:hidden"
        onClick={() => setShowFilters((prev) => !prev)}
      >
        Filters
      </button>

      <div className={`grid gap-2 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-lg backdrop-blur md:grid-cols-9 ${showFilters ? "grid" : "hidden md:grid"}`}>
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Search name/address" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Property ID (e.g. 026-001)" value={filters.propertyId} onChange={(event) => setFilters((prev) => ({ ...prev, propertyId: event.target.value }))} />
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.province} onChange={(event) => setFilters((prev) => ({ ...prev, province: event.target.value }))}>
          <option value="">All Provinces</option>
          {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
        </select>
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="District" value={filters.district} onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))} />
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="Municipality" value={filters.municipality} onChange={(event) => setFilters((prev) => ({ ...prev, municipality: event.target.value }))} />
        <input className="rounded border border-slate-300 px-3 py-2 text-sm" placeholder="VDC / Gaupalika" value={filters.vdc} onChange={(event) => setFilters((prev) => ({ ...prev, vdc: event.target.value }))} />
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.propertyType} onChange={(event) => setFilters((prev) => ({ ...prev, propertyType: event.target.value }))}>
          {propertyTypes.map((type) => <option key={type || "all"} value={type}>{type || "All Types"}</option>)}
        </select>
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
          {statuses.map((status) => <option key={status || "all"} value={status}>{status || "All Statuses"}</option>)}
        </select>
        <select className="rounded border border-slate-300 px-3 py-2 text-sm" value={filters.assignedAgent} onChange={(event) => setFilters((prev) => ({ ...prev, assignedAgent: event.target.value }))}>
          <option value="">All Agents</option>
          {agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.name}</option>)}
        </select>
      </div>

      {loading ? <Spinner label="Loading properties..." /> : null}

      {!loading ? (
      <>
      <div className="hidden overflow-x-auto rounded-2xl border border-white/60 bg-white/95 shadow-lg md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Property ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!properties.length ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No properties found</td></tr> : null}
            {properties.map((property) => (
              <tr key={property._id} className="border-t border-slate-200">
                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{property.propertyId || "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  <span className="inline-flex items-center gap-2">
                    {property.name}
                    {property.remarks ? (
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700"
                        title={String(property.remarks).slice(0, 60)}
                      >
                        i
                      </span>
                    ) : null}
                  </span>
                </td>
                <td className="px-4 py-3">{property.address}</td>
                <td className="px-4 py-3">{property.propertyType}</td>
                <td className="px-4 py-3">NPR {Number(property.price_npr || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[property.status] || "bg-slate-100 text-slate-700"}`}>
                    {property.status}
                  </span>
                </td>
                <td className="px-4 py-3">{property.assignedAgent?.name || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="min-h-11 text-blue-600" onClick={() => navigate(`/properties/${property._id}`)}>View</button>
                    <button className="min-h-11 text-slate-700" onClick={() => navigate(`/properties/${property._id}/edit`)}>Edit</button>
                    {user?.role === "admin" ? <button className="min-h-11 text-red-600" onClick={() => handleDelete(property._id)}>Delete</button> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {!properties.length ? <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow">No properties found. Try changing filters.</div> : null}
        {properties.map((property) => (
          <article key={property._id} className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{property.name}</h3>
              <span className={`rounded-full px-2 py-1 text-xs ${statusColors[property.status] || "bg-slate-100 text-slate-700"}`}>{property.status}</span>
            </div>
            <p className="text-xs font-semibold text-slate-500">ID: {property.propertyId || "-"}</p>
            <p className="text-sm text-slate-600">{property.address}</p>
            <p className="text-sm text-slate-600">{property.propertyType} • NPR {Number(property.price_npr || 0).toLocaleString()}</p>
            <p className="text-sm text-slate-600">Agent: {property.assignedAgent?.name || "-"}</p>
            {property.remarks ? <p className="mt-2 text-xs text-amber-700" title={String(property.remarks).slice(0, 60)}>Internal note: {String(property.remarks).slice(0, 60)}</p> : null}
            <div className="mt-3 flex gap-2">
              <button className="min-h-11 rounded border border-blue-200 px-3 text-sm text-blue-700" onClick={() => navigate(`/properties/${property._id}`)}>View</button>
              <button className="min-h-11 rounded border border-slate-200 px-3 text-sm text-slate-700" onClick={() => navigate(`/properties/${property._id}/edit`)}>Edit</button>
              {user?.role === "admin" ? <button className="min-h-11 rounded border border-red-200 px-3 text-sm text-red-700" onClick={() => handleDelete(property._id)}>Delete</button> : null}
            </div>
          </article>
        ))}
      </div>
      </>
      ) : null}
    </div>
  );
}

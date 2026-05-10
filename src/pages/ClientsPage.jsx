import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { districtsByProvince, municipalitiesByDistrict, provinces } from "../data/nepalLocations";
import { usePersistedSearchParams } from "../hooks/usePersistedSearchParams";
import Spinner from "../components/Spinner";

const statusColors = {
  "FB Lead": "bg-blue-100 text-blue-700",
  Intake: "bg-amber-100 text-amber-700",
  "Property Added/Requirement Taken": "bg-purple-100 text-purple-700",
  "Property Sold": "bg-green-100 text-green-700",
};

const types = ["", "Buyer", "Seller", "Both"];
const statuses = ["", "FB Lead", "Intake", "Property Added/Requirement Taken", "Property Sold"];
const sources = ["", "Facebook", "Instagram", "WhatsApp", "Phone Call", "Walk-in", "Referral", "Other"];

const STORAGE_KEY = "erp:listFilters:/clients";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchParams, patchParams, clearParams } = usePersistedSearchParams(STORAGE_KEY);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      type: searchParams.get("type") || "",
      status: searchParams.get("status") || "",
      source: searchParams.get("source") || "",
      assignedAgent: searchParams.get("assignedAgent") || "",
      minBudget: searchParams.get("minBudget") || "",
      maxBudget: searchParams.get("maxBudget") || "",
      province: searchParams.get("province") || "",
      district: searchParams.get("district") || "",
      municipality: searchParams.get("municipality") || "",
      vdc: searchParams.get("vdc") || "",
      ll: searchParams.get("ll") || "",
    }),
    [searchParams]
  );

  const locationMode = filters.ll === "v" ? "vdc" : "municipality";

  const districtOptions = useMemo(() => districtsByProvince[filters.province] || [], [filters.province]);
  const municipalityOptions = useMemo(() => municipalitiesByDistrict[filters.district] || [], [filters.district]);

  const fetchAgents = useCallback(async () => {
    const { data } = await api.get("/users/agents");
    setAgents(data);
  }, []);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const isVdcMode = searchParams.get("ll") === "v";
    const params = Object.fromEntries(
      Object.entries({
        search: searchParams.get("search"),
        type: searchParams.get("type"),
        status: searchParams.get("status"),
        source: searchParams.get("source"),
        assignedAgent: searchParams.get("assignedAgent"),
        minBudget: searchParams.get("minBudget"),
        maxBudget: searchParams.get("maxBudget"),
        province: searchParams.get("province"),
        district: searchParams.get("district"),
        municipality: isVdcMode ? "" : searchParams.get("municipality"),
        vdc: isVdcMode ? searchParams.get("vdc") : "",
      }).filter(([, value]) => value !== null && value !== undefined && value !== "")
    );
    const { data } = await api.get("/clients", { params });
    setClients(data);
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    await api.delete(`/clients/${id}`);
    fetchClients();
  };

  const setLocationMode = (mode) => {
    if (mode === "vdc") {
      patchParams({ ll: "v", municipality: "" });
    } else {
      patchParams({ ll: "", vdc: "" });
    }
  };

  const totalText = useMemo(() => `${clients.length} client(s)`, [clients.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-sm text-slate-600">{totalText}</p>
        </div>
        <Link
          to="/clients/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
        >
          Add Client
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 md:hidden">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          Filters
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
          onClick={clearParams}
        >
          Clear filters
        </button>
      </div>

      <div
        className={`space-y-3 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-lg backdrop-blur ${showFilters ? "block" : "hidden md:block"}`}
      >
        <div className="grid gap-2 md:grid-cols-5">
          <input
            placeholder="Search name, phone, email, address, location…"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.search}
            onChange={(event) => patchParams({ search: event.target.value })}
          />
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.type}
            onChange={(event) => patchParams({ type: event.target.value })}
          >
            {types.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All Types"}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.status}
            onChange={(event) => patchParams({ status: event.target.value })}
          >
            {statuses.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All Statuses"}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.source}
            onChange={(event) => patchParams({ source: event.target.value })}
          >
            {sources.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All Sources"}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.assignedAgent}
            onChange={(event) => patchParams({ assignedAgent: event.target.value })}
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-700">Location (matches client address hierarchy)</p>
          <div className="grid gap-2 md:grid-cols-4">
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              value={filters.province}
              onChange={(event) =>
                patchParams({
                  province: event.target.value,
                  district: "",
                  municipality: "",
                  vdc: "",
                })
              }
            >
              <option value="">All Provinces</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            <select
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              value={filters.district}
              onChange={(event) =>
                patchParams({
                  district: event.target.value,
                  municipality: "",
                  vdc: "",
                })
              }
            >
              <option value="">{filters.province ? "All Districts" : "Select province first"}</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">Local level (choose one)</p>
              <div className="mb-3 flex flex-wrap gap-4">
                <label className="text-sm">
                  <input
                    type="radio"
                    name="ll-client-list"
                    checked={locationMode === "municipality"}
                    onChange={() => setLocationMode("municipality")}
                  />
                  <span className="ml-2">Municipality</span>
                </label>
                <label className="text-sm">
                  <input type="radio" name="ll-client-list" checked={locationMode === "vdc"} onChange={() => setLocationMode("vdc")} />
                  <span className="ml-2">VDC / Gaupalika</span>
                </label>
              </div>
              {locationMode === "municipality" ? (
                municipalityOptions.length ? (
                  <select
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    value={filters.municipality}
                    onChange={(event) => patchParams({ municipality: event.target.value })}
                  >
                    <option value="">{filters.district ? "All municipalities" : "Select district first"}</option>
                    {municipalityOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    placeholder={filters.district ? "Municipality (type if not in list)" : "Select district first"}
                    value={filters.municipality}
                    onChange={(event) => patchParams({ municipality: event.target.value })}
                    disabled={!filters.district}
                  />
                )
              ) : (
                <input
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="VDC / Gaupalika"
                  value={filters.vdc}
                  onChange={(event) => patchParams({ vdc: event.target.value })}
                />
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs text-slate-500">Budget range (NPR) — applies to recorded buyer budget; sellers often have 0.</p>
          <div className="grid gap-2 md:grid-cols-2 md:max-w-xl">
            <input
              type="number"
              min={0}
              step={1}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Min budget (NPR)"
              value={filters.minBudget}
              onChange={(event) => patchParams({ minBudget: event.target.value })}
            />
            <input
              type="number"
              min={0}
              step={1}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Max budget (NPR)"
              value={filters.maxBudget}
              onChange={(event) => patchParams({ maxBudget: event.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:justify-end">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
          onClick={clearParams}
        >
          Clear filters
        </button>
      </div>

      {loading ? <Spinner label="Loading clients..." /> : null}

      {!loading ? (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-white/60 bg-white/95 shadow-lg md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Agent</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!clients.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No clients found
                    </td>
                  </tr>
                ) : null}
                {clients.map((client) => (
                  <tr key={client._id} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <span className="inline-flex items-center gap-2">
                        {client.name}
                        {client.remarks ? (
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700"
                            title={String(client.remarks).slice(0, 60)}
                          >
                            i
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-3">{client.contactNo}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{client.type}</span>
                    </td>
                    <td className="px-4 py-3">{client.source || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusColors[client.status] || "bg-slate-100 text-slate-700"}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{client.assignedAgent?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="min-h-11 text-blue-600" onClick={() => navigate(`/clients/${client._id}`)}>
                          View
                        </button>
                        <button
                          type="button"
                          className="min-h-11 text-slate-700"
                          onClick={() => navigate(`/clients/${client._id}/edit`)}
                        >
                          Edit
                        </button>
                        {user?.role === "admin" ? (
                          <button type="button" className="min-h-11 text-red-600" onClick={() => handleDelete(client._id)}>
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {!clients.length ? (
              <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow">No clients found. Try updating your filters.</div>
            ) : null}
            {clients.map((client) => (
              <article key={client._id} className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{client.name}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[client.status] || "bg-slate-100 text-slate-700"}`}>
                    {client.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {client.contactNo} • {client.type}
                </p>
                <p className="text-sm text-slate-600">
                  {client.source || "-"} • Agent: {client.assignedAgent?.name || "-"}
                </p>
                {client.remarks ? (
                  <p className="mt-2 text-xs text-amber-700" title={String(client.remarks).slice(0, 60)}>
                    Internal note: {String(client.remarks).slice(0, 60)}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button type="button" className="min-h-11 rounded border border-blue-200 px-3 text-sm text-blue-700" onClick={() => navigate(`/clients/${client._id}`)}>
                    View
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded border border-slate-200 px-3 text-sm text-slate-700"
                    onClick={() => navigate(`/clients/${client._id}/edit`)}
                  >
                    Edit
                  </button>
                  {user?.role === "admin" ? (
                    <button type="button" className="min-h-11 rounded border border-red-200 px-3 text-sm text-red-700" onClick={() => handleDelete(client._id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

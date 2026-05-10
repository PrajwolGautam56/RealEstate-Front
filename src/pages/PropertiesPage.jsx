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

const propertyTypes = ["", "Land", "House", "Apartment", "Commercial", "Other"];
const statuses = ["", "FB Lead", "Intake", "Property Added/Requirement Taken", "Property Sold"];

const STORAGE_KEY = "erp:listFilters:/properties";

export default function PropertiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { searchParams, patchParams, clearParams } = usePersistedSearchParams(STORAGE_KEY);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") || "",
      propertyId: searchParams.get("propertyId") || "",
      province: searchParams.get("province") || "",
      district: searchParams.get("district") || "",
      municipality: searchParams.get("municipality") || "",
      vdc: searchParams.get("vdc") || "",
      ll: searchParams.get("ll") || "",
      propertyType: searchParams.get("propertyType") || "",
      status: searchParams.get("status") || "",
      assignedAgent: searchParams.get("assignedAgent") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
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

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    const isVdcMode = searchParams.get("ll") === "v";
    const params = Object.fromEntries(
      Object.entries({
        search: searchParams.get("search"),
        propertyId: searchParams.get("propertyId"),
        province: searchParams.get("province"),
        district: searchParams.get("district"),
        municipality: isVdcMode ? "" : searchParams.get("municipality"),
        vdc: isVdcMode ? searchParams.get("vdc") : "",
        propertyType: searchParams.get("propertyType"),
        status: searchParams.get("status"),
        assignedAgent: searchParams.get("assignedAgent"),
        minPrice: searchParams.get("minPrice"),
        maxPrice: searchParams.get("maxPrice"),
      }).filter(([, value]) => value !== null && value !== undefined && value !== "")
    );
    const { data } = await api.get("/properties", { params });
    setProperties(data);
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    await api.delete(`/properties/${id}`);
    fetchProperties();
  };

  const setLocationMode = (mode) => {
    if (mode === "vdc") {
      patchParams({ ll: "v", municipality: "" });
    } else {
      patchParams({ ll: "", vdc: "" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Properties</h1>
          <p className="text-sm text-slate-600">{properties.length} properties</p>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex min-h-11 items-center rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200"
        >
          Add Property
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

      <div className={`space-y-3 rounded-2xl border border-white/60 bg-white/95 p-3 shadow-lg backdrop-blur ${showFilters ? "block" : "hidden md:block"}`}>
        <div className="grid gap-2 md:grid-cols-6">
          <input
            className="md:col-span-2 rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search ID, name, address, location, details…"
            value={filters.search}
            onChange={(event) => patchParams({ search: event.target.value })}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Property ID (e.g. 026-001)"
            value={filters.propertyId}
            onChange={(event) => patchParams({ propertyId: event.target.value })}
          />
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
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.propertyType}
            onChange={(event) => patchParams({ propertyType: event.target.value })}
          >
            {propertyTypes.map((type) => (
              <option key={type || "all"} value={type}>
                {type || "All Types"}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 md:grid-cols-2 md:max-w-xl">
          <input
            type="number"
            min={0}
            step={1}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Min price (NPR)"
            value={filters.minPrice}
            onChange={(event) => patchParams({ minPrice: event.target.value })}
          />
          <input
            type="number"
            min={0}
            step={1}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="Max price (NPR)"
            value={filters.maxPrice}
            onChange={(event) => patchParams({ maxPrice: event.target.value })}
          />
        </div>

        <div className="grid gap-2 md:grid-cols-6 md:items-end">
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">Local level filter (choose one)</p>
            <div className="mb-3 flex flex-wrap gap-4">
              <label className="text-sm">
                <input
                  type="radio"
                  name="ll-prop-list"
                  checked={locationMode === "municipality"}
                  onChange={() => setLocationMode("municipality")}
                />
                <span className="ml-2">Municipality</span>
              </label>
              <label className="text-sm">
                <input type="radio" name="ll-prop-list" checked={locationMode === "vdc"} onChange={() => setLocationMode("vdc")} />
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
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.status}
            onChange={(event) => patchParams({ status: event.target.value })}
          >
            {statuses.map((status) => (
              <option key={status || "all"} value={status}>
                {status || "All Statuses"}
              </option>
            ))}
          </select>
          <select
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            value={filters.assignedAgent}
            onChange={(event) => patchParams({ assignedAgent: event.target.value })}
          >
            <option value="">{user?.role === "admin" ? "All Agents" : "Agent"}</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name}
              </option>
            ))}
          </select>
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
                {!properties.length ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      No properties found
                    </td>
                  </tr>
                ) : null}
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
                        <button type="button" className="min-h-11 text-blue-600" onClick={() => navigate(`/properties/${property._id}`)}>
                          View
                        </button>
                        <button type="button" className="min-h-11 text-slate-700" onClick={() => navigate(`/properties/${property._id}/edit`)}>
                          Edit
                        </button>
                        {user?.role === "admin" ? (
                          <button type="button" className="min-h-11 text-red-600" onClick={() => handleDelete(property._id)}>
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
            {!properties.length ? (
              <div className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow">No properties found. Try changing filters.</div>
            ) : null}
            {properties.map((property) => (
              <article key={property._id} className="rounded-2xl border border-white/60 bg-white/95 p-4 shadow-lg">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{property.name}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColors[property.status] || "bg-slate-100 text-slate-700"}`}>
                    {property.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500">ID: {property.propertyId || "-"}</p>
                <p className="text-sm text-slate-600">{property.address}</p>
                <p className="text-sm text-slate-600">
                  {property.propertyType} • NPR {Number(property.price_npr || 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">Agent: {property.assignedAgent?.name || "-"}</p>
                {property.remarks ? (
                  <p className="mt-2 text-xs text-amber-700" title={String(property.remarks).slice(0, 60)}>
                    Internal note: {String(property.remarks).slice(0, 60)}
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button type="button" className="min-h-11 rounded border border-blue-200 px-3 text-sm text-blue-700" onClick={() => navigate(`/properties/${property._id}`)}>
                    View
                  </button>
                  <button type="button" className="min-h-11 rounded border border-slate-200 px-3 text-sm text-slate-700" onClick={() => navigate(`/properties/${property._id}/edit`)}>
                    Edit
                  </button>
                  {user?.role === "admin" ? (
                    <button type="button" className="min-h-11 rounded border border-red-200 px-3 text-sm text-red-700" onClick={() => handleDelete(property._id)}>
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

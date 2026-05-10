import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../api";
import Spinner from "../components/Spinner";

const statusColors = {
  "FB Lead": "bg-blue-100 text-blue-700",
  Intake: "bg-amber-100 text-amber-700",
  "Property Added/Requirement Taken": "bg-purple-100 text-purple-700",
  "Property Sold": "bg-green-100 text-green-700",
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [propertySearch, setPropertySearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [suggested, setSuggested] = useState([]);
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  const [linkingId, setLinkingId] = useState(null);

  const interestedIdSet = useMemo(() => {
    if (!client?.interestedProperties?.length) return new Set();
    return new Set(client.interestedProperties.map((p) => String(typeof p === "object" ? p._id : p)));
  }, [client]);

  const refreshClient = useCallback(async () => {
    const { data } = await api.get(`/clients/${id}`);
    setClient(data);
    if (["Buyer", "Both"].includes(data.type)) {
      setSuggestedLoading(true);
      try {
        const { data: sug } = await api.get(`/clients/${id}/suggested-properties`);
        setSuggested(Array.isArray(sug) ? sug : []);
      } finally {
        setSuggestedLoading(false);
      }
    } else {
      setSuggested([]);
    }
    return data;
  }, [id]);

  useEffect(() => {
    setPropertySearch("");
    setSearchResults([]);
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await refreshClient();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshClient]);

  useEffect(() => {
    if (!propertySearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await api.get("/properties", {
          params: { search: propertySearch.trim() },
        });
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter((p) => !interestedIdSet.has(String(p._id)));
        setSearchResults(filtered.slice(0, 15));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [propertySearch, interestedIdSet]);

  const linkProperty = async (propertyId) => {
    if (!client?._id) return;
    setLinkingId(propertyId);
    try {
      await api.post(`/properties/${propertyId}/interested/${client._id}`);
      toast.success("Property linked to this buyer");
      setPropertySearch("");
      setSearchResults([]);
      await refreshClient();
    } finally {
      setLinkingId(null);
    }
  };

  const unlinkProperty = async (propertyId) => {
    if (!client?._id) return;
    if (!window.confirm("Remove this property from interested list?")) return;
    setLinkingId(propertyId);
    try {
      await api.delete(`/properties/${propertyId}/interested/${client._id}`);
      toast.success("Link removed");
      await refreshClient();
    } finally {
      setLinkingId(null);
    }
  };

  if (loading) return <Spinner label="Loading client details..." />;
  if (!client) return <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg">Client not found.</div>;

  const isBuyer = client.type === "Buyer" || client.type === "Both";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{client.name}</h1>
        <Link to={`/clients/${client._id}/edit`} className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Edit
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-semibold">Client Information</h2>
          <InfoRow label="Contact" value={client.contactNo} />
          <InfoRow label="Email" value={client.email || "-"} />
          <InfoRow label="Type" value={client.type} />
          <InfoRow label="Property Type" value={client.propertyType || "-"} />
          <InfoRow label="Address" value={client.address || "-"} />
          <InfoRow label="Province" value={client.locationType?.province || "-"} />
          <InfoRow label="District" value={client.locationType?.district || "-"} />
          <InfoRow label="Local Level" value={client.locationType?.municipality || client.locationType?.vdc || "-"} />
          <InfoRow label="Source" value={client.source || "-"} />
          <InfoRow label="Budget NPR" value={client.budget_npr ? Number(client.budget_npr).toLocaleString() : "-"} />
          <InfoRow label="Location Preference" value={client.location_preference || "-"} />
          <InfoRow label="Assigned Agent" value={client.assignedAgent?.name || "-"} />
          <div className="mt-2">
            <span className={`rounded-full px-2 py-1 text-xs ${statusColors[client.status] || "bg-slate-100 text-slate-700"}`}>
              {client.status}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-semibold">Notes & Remarks</h2>
          <p className="mb-2 text-sm text-slate-500">Notes</p>
          <p className="rounded border border-slate-200 p-3 text-sm text-slate-700">{client.notes || "-"}</p>
          <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3">
            <p className="mb-2 text-sm font-medium text-amber-800">Internal remarks (visible to all staff)</p>
            <p className="text-sm text-amber-900">{client.remarks || "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">Linked Properties</h2>
        {!client.linkedProperties?.length ? (
          <p className="text-sm text-slate-500">No linked properties.</p>
        ) : (
          <div className="space-y-3">
            {client.linkedProperties.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="block rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <h3 className="font-semibold text-indigo-900">{property.name || property.title}</h3>
                <p className="text-sm text-slate-600">{property.address}</p>
                <p className="text-sm text-slate-700">NPR {Number(property.price_npr || property.price || 0).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isBuyer ? (
        <>
          <div className="rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50/90 to-white p-5 shadow-lg">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Suggested properties</h2>
            <p className="mb-4 text-sm text-slate-600">
              Based on this buyer&apos;s budget (≤ budget × 1.15), location preference text, and structured address fields. Lists you can access as assigned agent or admin.
            </p>
            {suggestedLoading ? (
              <p className="text-sm text-slate-500">Finding suggestions…</p>
            ) : !suggested.length ? (
              <p className="text-sm text-slate-500">No suggestions yet. Add budget / location preference on edit, or search below.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {suggested.map((property) => (
                  <div key={property._id} className="rounded-xl border border-indigo-100 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Suggested</p>
                        <Link to={`/properties/${property._id}`} className="font-semibold text-indigo-900 hover:underline">
                          {property.name}
                        </Link>
                        <p className="text-xs text-slate-500">{property.propertyId || "—"}</p>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{property.address}</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">
                          NPR {Number(property.price_npr || 0).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={linkingId === property._id || interestedIdSet.has(String(property._id))}
                        onClick={() => linkProperty(property._id)}
                        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50 min-h-11"
                      >
                        {interestedIdSet.has(String(property._id)) ? "Linked" : linkingId === property._id ? "…" : "Link"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
            <h2 className="mb-1 text-lg font-semibold">Search & link properties</h2>
            <p className="mb-3 text-sm text-slate-600">
              Search by property ID, name, address, or location — then link this buyer as interested.
            </p>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-indigo-400 focus:outline-none"
                placeholder="Type to search listings…"
                value={propertySearch}
                onChange={(event) => setPropertySearch(event.target.value)}
              />
              {searchLoading ? <p className="mt-2 text-xs text-slate-500">Searching…</p> : null}
              {propertySearch.trim() && !searchLoading && !searchResults.length ? (
                <p className="mt-2 text-sm text-slate-500">No matches (or all already linked).</p>
              ) : null}
              {searchResults.length ? (
                <ul className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50/80">
                  {searchResults.map((property) => (
                    <li key={property._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <Link to={`/properties/${property._id}`} className="font-medium text-indigo-900 hover:underline">
                          {property.name}
                        </Link>
                        <p className="text-xs text-slate-500">{property.propertyId || "—"} • NPR {Number(property.price_npr || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-600 line-clamp-2">{property.address}</p>
                      </div>
                      <button
                        type="button"
                        disabled={linkingId === property._id}
                        onClick={() => linkProperty(property._id)}
                        className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm min-h-11 hover:bg-indigo-50 disabled:opacity-50"
                      >
                        {linkingId === property._id ? "Linking…" : "Link buyer"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
            <h2 className="mb-3 text-lg font-semibold">Interested properties</h2>
            {!client.interestedProperties?.length ? (
              <p className="text-sm text-slate-500">No interested properties linked yet. Use suggestions or search above.</p>
            ) : (
              <div className="space-y-3">
                {client.interestedProperties.map((property) => {
                  const p = typeof property === "object" ? property : null;
                  const pid = p?._id || property;
                  return (
                    <div
                      key={String(pid)}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <Link
                        to={`/properties/${pid}`}
                        className="min-w-0 flex-1 transition hover:border-indigo-300 hover:bg-indigo-50/40"
                      >
                        <h3 className="font-semibold text-indigo-900">{p?.name ?? "Property"}</h3>
                        <p className="text-sm text-slate-600">
                          {[p?.locationType?.district, p?.locationType?.municipality || p?.locationType?.vdc].filter(Boolean).join(", ") || "-"}
                        </p>
                        <p className="text-sm text-slate-700">NPR {Number(p?.price_npr || 0).toLocaleString()}</p>
                        {p?.status ? (
                          <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${statusColors[p.status] || "bg-slate-100 text-slate-700"}`}>
                            {p.status}
                          </span>
                        ) : null}
                      </Link>
                      <button
                        type="button"
                        disabled={linkingId === String(pid)}
                        onClick={() => unlinkProperty(pid)}
                        className="shrink-0 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-red-700 min-h-11 hover:bg-red-50 disabled:opacity-50"
                      >
                        {linkingId === String(pid) ? "…" : "Unlink"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="mb-2 flex justify-between gap-3 border-b border-slate-100 pb-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}

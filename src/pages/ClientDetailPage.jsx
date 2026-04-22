import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

  useEffect(() => {
    const fetchClient = async () => {
      const { data } = await api.get(`/clients/${id}`);
      setClient(data);
      setLoading(false);
    };
    fetchClient();
  }, [id]);

  if (loading) return <Spinner label="Loading client details..." />;
  if (!client) return <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg">Client not found.</div>;

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
              <article key={property._id} className="rounded-xl border border-slate-200 p-3">
                <h3 className="font-semibold text-slate-900">{property.name || property.title}</h3>
                <p className="text-sm text-slate-600">{property.address}</p>
                <p className="text-sm text-slate-700">NPR {Number(property.price_npr || property.price || 0).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {(client.type === "Buyer" || client.type === "Both") ? (
        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-semibold">Interested properties</h2>
          {!client.interestedProperties?.length ? (
            <p className="text-sm text-slate-500">No interested properties linked.</p>
          ) : (
            <div className="space-y-3">
              {client.interestedProperties.map((property) => (
                <article key={property._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{property.name}</h3>
                      <p className="text-sm text-slate-600">
                        {property.locationType?.district || "-"}, {property.locationType?.municipality || "-"}
                      </p>
                      <p className="text-sm text-slate-700">NPR {Number(property.price_npr || 0).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${statusColors[property.status] || "bg-slate-100 text-slate-700"}`}>
                      {property.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
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

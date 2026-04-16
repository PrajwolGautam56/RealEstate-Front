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

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [buyerSearch, setBuyerSearch] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      const { data } = await api.get(`/properties/${id}`);
      setProperty(data);
      setLoading(false);
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    const fetchBuyers = async () => {
      const { data } = await api.get("/clients");
      setBuyers(data.filter((client) => client.type === "Buyer" || client.type === "Both"));
    };
    fetchBuyers();
  }, []);

  const refreshProperty = async () => {
    const { data } = await api.get(`/properties/${id}`);
    setProperty(data);
  };

  const linkBuyer = async () => {
    if (!selectedBuyer) return;
    await api.post(`/properties/${id}/interested/${selectedBuyer}`);
    setSelectedBuyer("");
    setBuyerSearch("");
    await refreshProperty();
  };

  const unlinkBuyer = async (clientId) => {
    await api.delete(`/properties/${id}/interested/${clientId}`);
    await refreshProperty();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Spinner label="Loading property details..." />;
  if (!property) return <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg">Property not found</div>;

  const linkedSeller = property.sellerInfo?.linkedSeller;
  const filteredBuyers = buyers.filter((buyer) => {
    if (!buyerSearch) return true;
    const search = buyerSearch.toLowerCase();
    return buyer.name.toLowerCase().includes(search) || buyer.contactNo.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{property.name}</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">Property ID: {property.propertyId || "-"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Export PDF / Print
          </button>
          <Link to={`/properties/${property._id}/edit`} className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Edit</Link>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
        <p className="text-sm text-slate-600">Property ID: {property.propertyId || "-"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-semibold">Property Information</h2>
          <InfoRow label="Address" value={property.address} />
          <InfoRow label="Exact Location" value={property.exactLocation || "-"} />
          <InfoRow label="Type" value={property.propertyType || "-"} />
          <InfoRow label="Price" value={`NPR ${Number(property.price_npr || 0).toLocaleString()}`} />
          <InfoRow label="Province" value={property.locationType?.province || "-"} />
          <InfoRow label="District" value={property.locationType?.district || "-"} />
          <InfoRow
            label="Local Level"
            value={property.locationType?.municipality || property.locationType?.vdc || "-"}
          />
          <InfoRow label="Assigned Agent" value={property.assignedAgent?.name || "-"} />
          <div className="mt-3">
            <span className={`rounded-full px-2 py-1 text-xs ${statusColors[property.status] || "bg-slate-100 text-slate-700"}`}>
              {property.status}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-semibold">Seller Information</h2>
          {property.sellerInfo?.sellerType === "linked" && linkedSeller ? (
            <div className="rounded border border-slate-200 p-3">
              <p className="font-semibold text-slate-900">{linkedSeller.name}</p>
              <p className="text-sm text-slate-600">{linkedSeller.contactNo}</p>
              <p className="text-sm text-slate-600">{linkedSeller.email || "-"}</p>
              <Link to={`/clients/${linkedSeller._id}`} className="mt-3 inline-block rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white">
                View Seller Profile
              </Link>
            </div>
          ) : (
            <div className="rounded border border-slate-200 p-3 text-sm text-slate-700">
              <p><span className="font-medium">Name:</span> {property.sellerInfo?.manualSellerName || "-"}</p>
              <p><span className="font-medium">Contact:</span> {property.sellerInfo?.manualSellerContact || "-"}</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">Property Details</h2>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{property.propertyDetails || "-"}</p>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">Images</h2>
        {!property.images?.length ? (
          <p className="text-sm text-slate-500">No images uploaded.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {property.images.map((url) => (
              <img key={url} src={url} alt={property.name} className="h-44 w-full rounded-xl object-cover shadow-sm" />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">Documents</h2>
        {!property.documents?.length ? (
          <p className="text-sm text-slate-500">No documents uploaded.</p>
        ) : (
          <div className="space-y-2">
            {property.documents.map((doc, index) => (
              <a key={`${doc.url}-${index}`} href={doc.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 p-3 text-sm text-blue-700 hover:bg-slate-50">
                {doc.name} - Download
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">Interested buyers</h2>
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm"
            placeholder="Search buyer name/contact"
            value={buyerSearch}
            onChange={(event) => setBuyerSearch(event.target.value)}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm"
            value={selectedBuyer}
            onChange={(event) => setSelectedBuyer(event.target.value)}
          >
            <option value="">Select buyer</option>
            {filteredBuyers.map((buyer) => (
              <option key={buyer._id} value={buyer._id}>
                {buyer.name} ({buyer.contactNo})
              </option>
            ))}
          </select>
          <button className="min-h-11 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200" onClick={linkBuyer}>
            Add buyer
          </button>
        </div>

        {!property.interestedBuyers?.length ? (
          <p className="text-sm text-slate-500">No interested buyers linked.</p>
        ) : (
          <div className="space-y-2">
            {property.interestedBuyers.map((buyer) => (
              <div key={buyer._id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{buyer.name}</p>
                  <p className="text-sm text-slate-600">{buyer.contactNo}</p>
                  <p className="text-sm text-slate-700">Budget: NPR {Number(buyer.budget_npr || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/${String(buyer.contactNo || "").replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    WhatsApp
                  </a>
                  <button
                    className="min-h-11 rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700"
                    onClick={() => unlinkBuyer(buyer._id)}
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg">
        <h2 className="mb-3 text-lg font-semibold">Internal remarks (visible to all staff)</h2>
        <div className="rounded border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm whitespace-pre-wrap text-amber-900">{property.remarks || "-"}</p>
        </div>
      </div>
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

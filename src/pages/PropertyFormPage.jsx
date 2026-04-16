import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { districtsByProvince, municipalitiesByDistrict, provinces } from "../data/nepalLocations";
import Spinner from "../components/Spinner";

const propertyTypes = ["Land", "House", "Apartment", "Commercial", "Other"];
const statuses = ["FB Lead", "Intake", "Property Added/Requirement Taken", "Property Sold"];

const initialForm = {
  name: "",
  address: "",
  exactLocation: "",
  propertyDetails: "",
  province: "Lumbini",
  district: "",
  municipality: "",
  vdc: "",
  propertyType: "Land",
  price_npr: "",
  status: "FB Lead",
  remarks: "",
  sellerType: "linked",
  linkedSeller: "",
  manualSellerName: "",
  manualSellerContact: "",
  assignedAgent: "",
};

export default function PropertyFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [agents, setAgents] = useState([]);
  const [clients, setClients] = useState([]);
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([{ name: "", file: null }]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [locationMode, setLocationMode] = useState("municipality");

  const districtOptions = useMemo(() => districtsByProvince[form.province] || [], [form.province]);
  const municipalityOptions = useMemo(() => municipalitiesByDistrict[form.district] || [], [form.district]);

  useEffect(() => {
    const load = async () => {
      const [{ data: agentData }, { data: clientData }, propertyResponse] = await Promise.all([
        api.get("/users/agents"),
        api.get("/clients", { params: { type: "Seller" } }),
        isEdit ? api.get(`/properties/${id}`) : Promise.resolve({ data: null }),
      ]);
      setAgents(agentData);
      setClients(clientData);

      if (isEdit && propertyResponse.data) {
        const property = propertyResponse.data;
        const initialMode = property.locationType?.vdc ? "vdc" : "municipality";
        setLocationMode(initialMode);
        setForm({
          name: property.name || "",
          address: property.address || "",
          exactLocation: property.exactLocation || "",
          propertyDetails: property.propertyDetails || "",
          province: property.locationType?.province || "Lumbini",
          district: property.locationType?.district || "",
          municipality: property.locationType?.municipality || "",
          vdc: property.locationType?.vdc || "",
          propertyType: property.propertyType || "Other",
          price_npr: property.price_npr || "",
          status: property.status || "FB Lead",
          remarks: property.remarks || "",
          sellerType: property.sellerInfo?.sellerType || "manual",
          linkedSeller: property.sellerInfo?.linkedSeller?._id || "",
          manualSellerName: property.sellerInfo?.manualSellerName || "",
          manualSellerContact: property.sellerInfo?.manualSellerContact || "",
          assignedAgent: property.assignedAgent?._id || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [id, isEdit]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationModeChange = (mode) => {
    setLocationMode(mode);
    setForm((prev) => ({
      ...prev,
      municipality: mode === "municipality" ? prev.municipality : "",
      vdc: mode === "vdc" ? prev.vdc : "",
    }));
  };

  const addDocumentRow = () => setDocuments((prev) => [...prev, { name: "", file: null }]);

  const updateDocumentRow = (index, key, value) => {
    setDocuments((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const uploadAssets = async (propertyId) => {
    if (images.length) {
      const imageForm = new FormData();
      images.forEach((file) => imageForm.append("images", file));
      await api.post(`/properties/${propertyId}/images`, imageForm, { headers: { "Content-Type": "multipart/form-data" } });
    }

    for (const doc of documents) {
      if (!doc.file) continue;
      const docForm = new FormData();
      docForm.append("name", doc.name || doc.file.name);
      docForm.append("document", doc.file);
      await api.post(`/properties/${propertyId}/documents`, docForm, { headers: { "Content-Type": "multipart/form-data" } });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const hasMunicipality = form.municipality.trim();
    const hasVdc = form.vdc.trim();
    if (!hasMunicipality && !hasVdc) {
      setError("Please provide either Municipality or VDC/Gaupalika.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        address: form.address,
        exactLocation: form.exactLocation,
        propertyDetails: form.propertyDetails,
        locationType: {
          country: "Nepal",
          province: form.province,
          district: form.district,
          municipality: form.municipality,
          vdc: form.vdc,
        },
        propertyType: form.propertyType,
        price_npr: Number(form.price_npr || 0),
        status: form.status,
        remarks: form.remarks,
        sellerInfo: {
          sellerType: form.sellerType,
          linkedSeller: form.sellerType === "linked" ? form.linkedSeller : undefined,
          manualSellerName: form.sellerType === "manual" ? form.manualSellerName : "",
          manualSellerContact: form.sellerType === "manual" ? form.manualSellerContact : "",
        },
        assignedAgent: form.assignedAgent || undefined,
      };

      const response = isEdit ? await api.put(`/properties/${id}`, payload) : await api.post("/properties", payload);
      await uploadAssets(response.data._id);
      navigate(`/properties/${response.data._id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save property");
    }
  };

  if (loading) return <Spinner label="Loading property form..." />;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg backdrop-blur">
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">{isEdit ? "Edit Property" : "Add Property"}</h1>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
        <Field label="Address" name="address" value={form.address} onChange={handleChange} required />
        <Field label="Exact Location / Landmark" name="exactLocation" value={form.exactLocation} onChange={handleChange} />
        <Select label="Property Type" name="propertyType" value={form.propertyType} onChange={handleChange} options={propertyTypes} />
        <Select label="Province" name="province" value={form.province} onChange={handleChange} options={provinces} />
        <Select label="District" name="district" value={form.district} onChange={handleChange} options={districtOptions} />
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-900">Local Level (choose one)</p>
          <div className="mb-3 flex gap-4">
            <label className="text-sm">
              <input type="radio" checked={locationMode === "municipality"} onChange={() => handleLocationModeChange("municipality")} />
              <span className="ml-2">Municipality</span>
            </label>
            <label className="text-sm">
              <input type="radio" checked={locationMode === "vdc"} onChange={() => handleLocationModeChange("vdc")} />
              <span className="ml-2">VDC / Gaupalika</span>
            </label>
          </div>
          {locationMode === "municipality" ? (
            <Select label="Municipality" name="municipality" value={form.municipality} onChange={handleChange} options={municipalityOptions} />
          ) : (
            <Field label="VDC / Gaupalika" name="vdc" value={form.vdc} onChange={handleChange} />
          )}
          <p className="mt-2 text-xs text-slate-500">Only one of Municipality or VDC/Gaupalika is required.</p>
        </div>
        <Field label="Price NPR" name="price_npr" value={form.price_npr} onChange={handleChange} type="number" />
        <Select label="Status" name="status" value={form.status} onChange={handleChange} options={statuses} />
        <label className="text-sm font-medium text-slate-700">
          Assigned Agent
          <select name="assignedAgent" value={form.assignedAgent} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none">
            <option value="">Select Agent</option>
            {agents.map((agent) => <option key={agent._id} value={agent._id}>{agent.name}</option>)}
          </select>
        </label>
        <TextArea label="Property Details" name="propertyDetails" value={form.propertyDetails} onChange={handleChange} />
        <TextArea label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} />

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Seller Information</h2>
          <div className="mb-3 flex gap-4">
            <label className="text-sm"><input type="radio" name="sellerType" value="linked" checked={form.sellerType === "linked"} onChange={handleChange} /> Link existing client</label>
            <label className="text-sm"><input type="radio" name="sellerType" value="manual" checked={form.sellerType === "manual"} onChange={handleChange} /> Add manually</label>
          </div>
          {form.sellerType === "linked" ? (
            <label className="text-sm font-medium text-slate-700">
              Seller Client
              <select name="linkedSeller" value={form.linkedSeller} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none">
                <option value="">Select Seller</option>
                {clients.map((client) => <option key={client._id} value={client._id}>{client.name} ({client.contactNo})</option>)}
              </select>
            </label>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Manual Seller Name" name="manualSellerName" value={form.manualSellerName} onChange={handleChange} />
              <Field label="Manual Seller Contact" name="manualSellerContact" value={form.manualSellerContact} onChange={handleChange} />
            </div>
          )}
        </div>

        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Property Images
          <input type="file" multiple accept="image/*" className="mt-1 block w-full text-sm" onChange={(event) => setImages(Array.from(event.target.files || []))} />
          {images.length ? <p className="mt-1 text-xs text-slate-500">{images.length} image(s) selected</p> : null}
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
            <button type="button" className="min-h-11 text-xs font-semibold text-indigo-600" onClick={addDocumentRow}>+ Add document</button>
          </div>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-2">
                <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none" placeholder="Document name (e.g. Lalpurja)" value={doc.name} onChange={(event) => updateDocumentRow(index, "name", event.target.value)} />
                <input type="file" className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm" onChange={(event) => updateDocumentRow(index, "file", event.target.files?.[0] || null)} />
              </div>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <button className="min-h-11 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-200">{isEdit ? "Update Property" : "Create Property"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, ...props }) {
  return <label className="text-sm font-medium text-slate-700">{label}<input {...props} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none" /></label>;
}

function TextArea({ label, ...props }) {
  return <label className="text-sm font-medium text-slate-700 md:col-span-2">{label}<textarea {...props} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none" /></label>;
}

function Select({ label, name, value, onChange, options }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select name={name} value={value} onChange={onChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none">
        <option value="">Select {label}</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

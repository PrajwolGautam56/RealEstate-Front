import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Spinner from "../components/Spinner";

const sources = ["Facebook", "Instagram", "WhatsApp", "Phone Call", "Walk-in", "Referral", "Other"];
const statuses = ["FB Lead", "Intake", "Property Added/Requirement Taken", "Property Sold"];
const types = ["Buyer", "Seller", "Both"];

const initialForm = {
  name: "",
  contactNo: "",
  email: "",
  type: "Buyer",
  address: "",
  source: "Other",
  budget_npr: "",
  location_preference: "",
  notes: "",
  remarks: "",
  status: "FB Lead",
  assignedAgent: "",
};

export default function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: agentData }, clientResponse] = await Promise.all([
        api.get("/users/agents"),
        isEdit ? api.get(`/clients/${id}`) : Promise.resolve({ data: null }),
      ]);
      setAgents(agentData);

      if (isEdit && clientResponse.data) {
        const client = clientResponse.data;
        setForm({
          name: client.name || "",
          contactNo: client.contactNo || "",
          email: client.email || "",
          type: client.type || "Buyer",
          address: client.address || "",
          source: client.source || "Other",
          budget_npr: client.budget_npr || "",
          location_preference: client.location_preference || "",
          notes: client.notes || "",
          remarks: client.remarks || "",
          status: client.status || "FB Lead",
          assignedAgent: client.assignedAgent?._id || "",
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        budget_npr: form.budget_npr ? Number(form.budget_npr) : 0,
      };
      if (isEdit) {
        await api.put(`/clients/${id}`, payload);
      } else {
        await api.post("/clients", payload);
      }
      navigate("/clients");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save client");
    }
  };

  if (loading) return <Spinner label="Loading client form..." />;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg backdrop-blur">
      <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">{isEdit ? "Edit Client" : "Add Client"}</h1>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Field label="Name" name="name" value={form.name} onChange={handleChange} required />
        <Field label="Contact No" name="contactNo" value={form.contactNo} onChange={handleChange} required />
        <Field label="Email" name="email" value={form.email} onChange={handleChange} type="email" />
        <SelectField label="Type" name="type" value={form.type} onChange={handleChange} options={types} />
        <Field label="Address" name="address" value={form.address} onChange={handleChange} />
        <SelectField label="Source" name="source" value={form.source} onChange={handleChange} options={sources} />
        <Field label="Budget NPR" name="budget_npr" value={form.budget_npr} onChange={handleChange} type="number" />
        <Field label="Location Preference" name="location_preference" value={form.location_preference} onChange={handleChange} />
        <SelectField label="Status" name="status" value={form.status} onChange={handleChange} options={statuses} />
        <label className="text-sm font-medium text-slate-700">
          Assigned Agent
          <select name="assignedAgent" value={form.assignedAgent} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none">
            <option value="">Select Agent</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name} ({agent.role})
              </option>
            ))}
          </select>
        </label>
        <TextArea label="Notes" name="notes" value={form.notes} onChange={handleChange} />
        <TextArea label="Remarks" name="remarks" value={form.remarks} onChange={handleChange} />
        {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <button className="min-h-11 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-200">{isEdit ? "Update Client" : "Create Client"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input {...props} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none" />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="text-sm font-medium text-slate-700 md:col-span-2">
      {label}
      <textarea {...props} rows={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none" />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <select name={name} value={value} onChange={onChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 shadow-sm focus:border-indigo-400 focus:outline-none">
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Invalid login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        <section className="hidden bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-500 p-10 text-white lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">Real Estate ERP</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">Premium CRM for modern real estate teams</h1>
          <p className="mt-4 text-sm text-blue-50/95">
            Manage clients, properties, buyer interests, follow-ups, and internal collaboration in one dashboard.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <Feature text="Clients and Properties with status pipelines" />
            <Feature text="Buyer-property interest linking + WhatsApp reachout" />
            <Feature text="Role-based access for admin and agents" />
            <Feature text="Cloudinary uploads for property media and documents" />
          </div>
        </section>

        <section className="bg-white/95 p-6 sm:p-8 lg:p-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Premium CRM</p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-600">Sign in to continue to your workspace.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm focus:border-indigo-400 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm focus:border-indigo-400 focus:outline-none"
              />
            </label>
            {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
            <button
              disabled={submitting}
              className="min-h-11 w-full rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 py-2 font-semibold text-white shadow-lg shadow-indigo-200 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            API endpoint: `{apiUrl}`
          </p>
        </section>
      </div>
    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
      <p className="text-white/95">{text}</p>
    </div>
  );
}

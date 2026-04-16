import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminNavItems = [
  { label: "Dashboard", to: "/" },
  { label: "Clients", to: "/clients" },
  { label: "Properties", to: "/properties" },
  { label: "Leads", to: "/leads" },
  { label: "Admin", to: "/admin" },
];
const agentNavItems = [
  { label: "Dashboard", to: "/" },
  { label: "Clients", to: "/clients" },
  { label: "Properties", to: "/properties" },
  { label: "Leads", to: "/leads" },
];

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const { user, logout } = useAuth();
  const navItems = user?.role === "admin" ? adminNavItems : agentNavItems;

  return (
    <>
      {mobileOpen ? <button onClick={onCloseMobile} className="fixed inset-0 z-30 bg-black/40 md:hidden" aria-label="Close sidebar overlay" /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/20 bg-linear-to-b from-slate-950 via-slate-900 to-slate-900 p-4 text-white transition-transform md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="mb-6 text-lg font-bold tracking-wide text-white">Real Estate ERP</h2>
        <div className="mb-6 rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur">
          <p className="font-semibold text-white">{user?.name || "User"}</p>
          <p className="text-sm uppercase text-slate-300">{user?.role || "agent"}</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-white text-slate-900 font-semibold shadow-sm" : "text-slate-200 hover:bg-white/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-auto min-h-11 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900"
        >
          Logout
        </button>
      </aside>
    </>
  );
}

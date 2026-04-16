import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import ClientsPage from "./pages/ClientsPage";
import ClientFormPage from "./pages/ClientFormPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyFormPage from "./pages/PropertyFormPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import TopNavbar from "./components/TopNavbar";

function Page({ title }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg backdrop-blur">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">{title} module UI is being finalized for this CRM.</p>
    </div>
  );
}

function DashboardShell() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:ml-0">
        <TopNavbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route path="/clients/:id/edit" element={<ClientFormPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/properties/new" element={<PropertyFormPage />} />
            <Route path="/properties/:id" element={<PropertyDetailPage />} />
            <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
            <Route path="/leads" element={<Page title="Leads" />} />
            {isAdmin ? <Route path="/admin" element={<AdminPage />} /> : null}
            <Route path="*" element={<Navigate to={isAdmin ? "/" : "/clients"} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="p-6 text-slate-600">Loading app...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;

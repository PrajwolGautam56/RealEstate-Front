import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function TopNavbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ clients: [], properties: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], properties: [] });
      return;
    }

    const timer = setTimeout(async () => {
      const [clientsRes, propertiesRes] = await Promise.all([
        api.get("/clients", { params: { search: query } }),
        api.get("/properties", { params: { search: query } }),
      ]);
      setResults({
        clients: clientsRes.data.slice(0, 5),
        properties: propertiesRes.data.slice(0, 5),
      });
      setOpen(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 md:px-6">
        <button
          onClick={onMenuClick}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden"
          aria-label="Open sidebar"
        >
          ☰
        </button>
        <div className="relative w-full max-w-2xl">
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm focus:border-blue-400 focus:outline-none"
            placeholder="Search clients and properties..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
          />
          {open && query ? (
            <div className="absolute left-0 right-0 top-12 max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
              <ResultSection
                title="Clients"
                items={results.clients}
                emptyText="No matching clients"
                onClick={(item) => goTo(`/clients/${item._id}`)}
                render={(item) => `${item.name} • ${item.type} • ${item.status}`}
              />
              <ResultSection
                title="Properties"
                items={results.properties}
                emptyText="No matching properties"
                onClick={(item) => goTo(`/properties/${item._id}`)}
                render={(item) =>
                  `${item.propertyId || "-"} • ${item.name} • ${item.locationType?.district || "-"}, ${item.locationType?.municipality || "-"} • ${item.status}`
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ResultSection({ title, items, onClick, render, emptyText }) {
  return (
    <div className="mb-3 last:mb-0">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {!items.length ? (
        <p className="rounded bg-slate-50 px-2 py-2 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => onClick(item)}
              className="block min-h-11 w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100"
            >
              {render(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

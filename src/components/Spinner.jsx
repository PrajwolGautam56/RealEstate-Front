export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/60 bg-white/95 p-6 shadow-lg backdrop-blur">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps list filters in the URL and mirrors them to sessionStorage so returning
 * from a detail page (URL without query) can restore the last filters.
 *
 * Restore runs before persisting so an empty first paint does not wipe saved state.
 */
export function usePersistedSearchParams(storageKey) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = window.location.search;
    const emptyQuery = !qs || qs === "?";
    if (emptyQuery) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        setSearchParams(new URLSearchParams(saved), { replace: true });
        return;
      }
    }
    sessionStorage.setItem(storageKey, searchParams.toString());
  }, [storageKey, searchParams, setSearchParams]);

  const patchParams = (partial) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  const clearParams = () => {
    sessionStorage.removeItem(storageKey);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return { searchParams, patchParams, clearParams, setSearchParams };
}

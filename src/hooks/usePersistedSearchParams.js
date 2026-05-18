import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps list filters in the URL and mirrors them to sessionStorage.
 * Restore from sessionStorage runs only once on mount so it does not
 * overwrite filters the user is actively changing.
 */
export function usePersistedSearchParams(storageKey) {
  const [searchParams, setSearchParams] = useSearchParams();
  const didRestoreRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!didRestoreRef.current) {
      didRestoreRef.current = true;
      const qs = window.location.search;
      const emptyQuery = !qs || qs === "?";
      if (emptyQuery) {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          setSearchParams(new URLSearchParams(saved), { replace: true });
          return;
        }
      }
    }

    sessionStorage.setItem(storageKey, searchParams.toString());
  }, [storageKey, searchParams, setSearchParams]);

  const patchParams = (partial) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(partial).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") next.set(key, String(value));
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  const clearParams = () => {
    sessionStorage.removeItem(storageKey);
    didRestoreRef.current = true;
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return { searchParams, patchParams, clearParams, setSearchParams };
}

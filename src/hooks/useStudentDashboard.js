import { useCallback, useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("portal_jwt_token") ||
    localStorage.getItem("jwt_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

/** Fetch JSON with JWT + Arabic error mapping. Throws on failure. */
export async function studentApiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error ||
      (res.status === 401
        ? "انتهت الجلسة — سجّل الدخول مجدداً"
        : res.status === 403
          ? "غير مصرح لك بالوصول إلى هذه البيانات"
          : res.status === 429
            ? "طلبات كثيرة — انتظر قليلاً ثم حاول مجدداً"
            : "حدث خطأ في الخادم");
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const initialAsync = { data: null, loading: true, error: null };

function useAsync(fetcher, deps = []) {
  const [state, setState] = useState(initialAsync);
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error.message || "خطأ غير متوقع" });
      throw error;
    }
  }, deps);
  useEffect(() => {
    run().catch(() => {});
  }, deps);
  return { ...state, refetch: run };
}

/**
 * Central data layer for the Student Dashboard.
 * Every request carries the student JWT; identity is resolved server-side
 * from the token (no student id is ever sent from the client).
 */
export function useStudentDashboard() {
  const profile = useAsync(() => studentApiFetch("/api/student/profile"), []);
  const wallet = useAsync(() => studentApiFetch("/api/student/wallet"), []);
  const today = useAsync(() => studentApiFetch("/api/schedule/today"), []);
  const homework = useAsync(() => studentApiFetch("/api/homework/student"), []);
  const lastScan = useAsync(() => studentApiFetch("/api/attendance/last"), []);

  const [weekCache, setWeekCache] = useState({ data: null, loading: false, error: null });
  const fetchWeek = useCallback(async () => {
    setWeekCache({ data: null, loading: true, error: null });
    try {
      const data = await studentApiFetch("/api/schedule/week");
      setWeekCache({ data, loading: false, error: null });
      return data;
    } catch (e) {
      setWeekCache({ data: null, loading: false, error: e.message });
      throw e;
    }
  }, []);

  const [scanState, setScanState] = useState({ direction: null, loading: false, error: null });
  const scan = useCallback(
    async (direction) => {
      if (!["IN", "OUT"].includes(direction)) throw new Error("اتجاه غير صالح");
      setScanState({ direction, loading: true, error: null });
      try {
        const data = await studentApiFetch("/api/attendance/scan", {
          method: "POST",
          body: JSON.stringify({ direction, scanned_at: new Date().toISOString() }),
        });
        setScanState({ direction, loading: false, error: null });
        // Refresh last-scan so header/location update immediately
        lastScan.refetch().catch(() => {});
        return data;
      } catch (e) {
        setScanState({ direction, loading: false, error: e.message });
        throw e;
      }
    },
    []
  );

  const refetchAll = useCallback(() => {
    profile.refetch().catch(() => {});
    wallet.refetch().catch(() => {});
    today.refetch().catch(() => {});
    homework.refetch().catch(() => {});
    lastScan.refetch().catch(() => {});
  }, []);

  return { profile, wallet, today, homework, lastScan, weekCache, fetchWeek, scanState, scan, refetchAll };
}

export { getToken };

import { useState, useEffect, useMemo, useRef } from "react";
import { titleCase } from "./utils/titleCase";

interface Alert {
  id: string;
  location_name: string;
  active: boolean;
  unsubscribe_token: string;
}

export const ManageAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [unsubscribingIds, setUnsubscribingIds] = useState<Set<string>>(new Set());
  const [unsubscribingAll, setUnsubscribingAll] = useState(false);

  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("token"),
    [],
  );

  // Show a transient success message, replacing any pending auto-clear timer.
  const messageTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashMessage = (text: string) => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMessage(text);
    messageTimer.current = setTimeout(() => setMessage(""), 3000);
  };
  useEffect(
    () => () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    },
    [],
  );

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (!token) {
          setError("No management token provided.");
          setLoading(false);
          return;
        }

        const endpoint =
          import.meta.env.VITE_MANAGE_ALERTS_FUNCTION ||
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-alerts`;
        const response = await fetch(`${endpoint}?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setAlerts(data.alerts || []);
        } else {
          setError(data.error || "Failed to load alerts.");
        }
      } catch (err) {
        console.error("Error fetching alerts:", err);
        setError("An error occurred while loading alerts.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [token]);

  const handleUnsubscribe = async (alertId: string) => {
    setError("");
    setUnsubscribingIds(prev => new Set(prev).add(alertId));

    try {
      const endpoint =
        import.meta.env.VITE_UNSUBSCRIBE_ALERT_FUNCTION ||
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe-alert`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, alertId }),
      });

      const data = await response.json();

      if (response.ok) {
        const name = alerts.find(a => a.id === alertId)?.location_name || "location";
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        flashMessage(`Unsubscribed from ${name}`);
      } else {
        setError(data.error || "Failed to unsubscribe.");
      }
    } catch (err) {
      console.error("Unsubscribe error:", err);
      setError("An error occurred while unsubscribing.");
    } finally {
      setUnsubscribingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const handleUnsubscribeAll = async () => {
    if (unsubscribingAll) return;
    if (!window.confirm("Are you sure you want to unsubscribe from all alerts?")) {
      return;
    }

    setError("");
    setUnsubscribingAll(true);
    setUnsubscribingIds(new Set(alerts.map(a => a.id)));

    try {
      const endpoint =
        import.meta.env.VITE_UNSUBSCRIBE_ALL_FUNCTION ||
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe-all-alerts`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlerts([]);
        flashMessage("You have been unsubscribed from all alerts.");
      } else {
        setError(data.error || "Failed to unsubscribe from all alerts.");
      }
    } catch (err) {
      console.error("Unsubscribe all error:", err);
      setError("An error occurred while unsubscribing from all alerts.");
    } finally {
      setUnsubscribingAll(false);
      setUnsubscribingIds(new Set());
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:py-20">
      <div className="text-center">
        <h1 className="font-herculanum text-4xl sm:text-5xl">Manage Alerts</h1>
      </div>

      <div className="mt-10 space-y-4">
        {loading && (
          <ul aria-hidden="true" className="space-y-3">
            {[0, 1].map((i) => (
              <li key={i} className="panel flex items-center justify-between gap-4 p-4">
                <div className="w-full space-y-2">
                  <div className="skel h-4 w-1/3" />
                  <div className="skel h-3 w-16" />
                </div>
                <div className="skel h-9 w-28 shrink-0 rounded-full" />
              </li>
            ))}
            <li className="sr-only">Loading your alerts…</li>
          </ul>
        )}

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-900 bg-opacity-50 p-6">
            <p className="mb-2 text-xl text-red-100">✗ Error</p>
            <p className="text-indigo-100">{error}</p>
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-500 bg-green-900 bg-opacity-50 p-6">
            <p className="text-indigo-100">{message}</p>
          </div>
        )}

        {!loading && alerts.length === 0 && !error && (
          <div className="panel p-8 text-center">
            <p className="text-ink-soft">You don't have any active alerts.</p>
            <p className="mt-4">
              <a href="/" className="text-yellow-50 underline hover:text-yellow-100">
                Return to home
              </a>
            </p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <>
            <ul className="space-y-3">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="panel flex items-center justify-between gap-4 p-4 pl-5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {titleCase(alert.location_name)}
                    </p>
                    <p className="mt-1 text-sm text-indigo-300">
                      {alert.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(alert.id)}
                    disabled={unsubscribingIds.has(alert.id)}
                    className="btn btn-ghost shrink-0 px-4 py-2 text-sm"
                  >
                    {unsubscribingIds.has(alert.id) ? "Unsubscribing…" : "Unsubscribe"}
                  </button>
                </li>
              ))}
            </ul>

            {alerts.length > 1 && (
              <div className="pt-2 text-center">
                <button
                  onClick={handleUnsubscribeAll}
                  disabled={unsubscribingAll}
                  className="btn btn-ghost px-5 py-2 text-sm"
                >
                  {unsubscribingAll ? "Unsubscribing…" : "Unsubscribe from All"}
                </button>
              </div>
            )}

            <p className="pt-2 text-center">
              <a href="/" className="text-yellow-50 underline hover:text-yellow-100">
                Return to home
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
};

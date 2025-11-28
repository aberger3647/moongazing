import { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setError("No management token provided.");
          setLoading(false);
          return;
        }

        const response = await fetch(`/.netlify/functions/manage-alerts?token=${token}`);
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
  }, []);

  const handleUnsubscribe = async (alertId: string) => {
    setUnsubscribingIds(prev => new Set(prev).add(alertId));

    try {
      const response = await fetch(`/.netlify/functions/unsubscribe-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        setMessage(`Unsubscribed from ${alerts.find(a => a.id === alertId)?.location_name || "location"}`);
        setTimeout(() => setMessage(""), 3000);
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
    if (!window.confirm("Are you sure you want to unsubscribe from all alerts?")) {
      return;
    }

    setUnsubscribingIds(new Set(alerts.map(a => a.id)));

    try {
      const response = await fetch(`/.netlify/functions/unsubscribe-all-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          alertIds: alerts.map(a => a.id)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAlerts([]);
        setMessage("You have been unsubscribed from all alerts.");
      } else {
        setError(data.error || "Failed to unsubscribe from all alerts.");
      }
    } catch (err) {
      console.error("Unsubscribe all error:", err);
      setError("An error occurred while unsubscribing from all alerts.");
    } finally {
      setUnsubscribingIds(new Set());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-900 p-4">
      <div className="max-w-2xl w-full">
        <h1 className="font-herculanum text-4xl mb-8 text-yellow-50 text-center">Manage Alerts</h1>

        {loading && (
          <div className="text-lg text-indigo-100 text-center">
            Loading your alerts...
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-6 mb-6">
            <p className="text-xl text-red-100 mb-2">✗ Error</p>
            <p className="text-indigo-100">{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-6 mb-6">
            <p className="text-indigo-100">{message}</p>
          </div>
        )}

        {!loading && alerts.length === 0 && !error && (
          <div className="bg-indigo-900 bg-opacity-50 border border-indigo-500 rounded-lg p-6 text-center">
            <p className="text-indigo-100">You don't have any active alerts.</p>
            <p className="text-indigo-100 mt-4">
              <a href="/" className="text-yellow-50 hover:text-yellow-100 underline">
                Return to home
              </a>
            </p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-indigo-900 bg-opacity-50 border border-indigo-500 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-indigo-100 font-semibold">
                      {titleCase(alert.location_name)}
                    </p>
                    <p className="text-indigo-300 text-sm">
                      {alert.active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(alert.id)}
                    disabled={unsubscribingIds.has(alert.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-yellow-50 px-4 py-2 rounded-lg transition"
                  >
                    {unsubscribingIds.has(alert.id) ? "Unsubscribing..." : "Unsubscribe"}
                  </button>
                </div>
              ))}
            </div>

            {alerts.length > 1 && (
              <div className="text-center mb-6">
                <button
                  onClick={handleUnsubscribeAll}
                  className="bg-indigo-600 hover:bg-indigo-700 text-yellow-50 px-6 py-2 rounded-lg transition"
                >
                  Unsubscribe from All
                </button>
              </div>
            )}

            <p className="text-indigo-100 text-center">
              <a href="/" className="text-yellow-50 hover:text-yellow-100 underline">
                Return to home
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

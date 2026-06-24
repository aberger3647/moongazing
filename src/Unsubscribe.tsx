import { useState, useEffect } from "react";

export const Unsubscribe = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleUnsubscribe = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("No unsubscribe token provided.");
          return;
        }

        const endpoint =
          import.meta.env.VITE_UNSUBSCRIBE_FUNCTION ||
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe`;
        const response = await fetch(`${endpoint}?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("You have been successfully unsubscribed from alerts.");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to unsubscribe. Please try again.");
        }
      } catch (error) {
        console.error("Unsubscribe error:", error);
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    };

    handleUnsubscribe();
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      <h1 className="font-herculanum text-4xl tracking-display sm:text-5xl">Moon Gazing Alerts</h1>

      {status === "loading" && (
        <p className="mt-8 text-indigo-100">Processing your request…</p>
      )}

      {status === "success" && (
        <div className="mt-8 w-full rounded-lg border border-green-500 bg-green-900 bg-opacity-50 p-6">
          <p className="mb-4 text-xl text-green-100">✓ Success</p>
          <p className="text-indigo-100">{message}</p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-8 w-full rounded-lg border border-red-500 bg-red-900 bg-opacity-50 p-6">
          <p className="mb-4 text-xl text-red-100">✗ Error</p>
          <p className="text-indigo-100">{message}</p>
        </div>
      )}

      <p className="mt-8">
        <a href="/" className="text-yellow-50 underline hover:text-yellow-100">
          Return to home
        </a>
      </p>
    </main>
  );
};

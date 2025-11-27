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

        const response = await fetch(`/.netlify/functions/unsubscribe?token=${token}`);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-900">
      <div className="text-center px-4">
        <h1 className="font-herculanum text-4xl mb-6 text-yellow-50">Moon Gazing Alerts</h1>
        
        {status === "loading" && (
          <div className="text-lg text-indigo-100">
            Processing your request...
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-xl text-green-100 mb-4">✓ Success</p>
            <p className="text-indigo-100">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-xl text-red-100 mb-4">✗ Error</p>
            <p className="text-indigo-100">{message}</p>
          </div>
        )}

        <p className="text-indigo-100 mt-8">
          <a href="/" className="text-yellow-50 hover:text-yellow-100 underline">
            Return to home
          </a>
        </p>
      </div>
    </div>
  );
};

import { useState } from "react";
import { sendEmail } from "../utils";
import { supabase } from "../supabaseClient";

interface AlertsProps {
  location: string;
  lat?: number;
  lng?: number;
}

export const Alerts = ({ location, lat, lng }: AlertsProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !lat || !lng) return;

    setLoading(true);
    setMessage("");

    try {
      // Get or create user
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      let userId = existingUser?.id;

      if (!userId) {
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert({ email })
          .select("id")
          .single();

        if (userError) throw userError;
        userId = newUser.id;
      }

      // Get or create user location
      const { data: locationData, error: locationError } = await supabase
        .from("user_locations")
        .upsert({
          user_id: userId,
          lat,
          lng,
          location_name: location
        }, { onConflict: ['user_id', 'lat', 'lng'] })
        .select("id")
        .single();

      if (locationError) throw locationError;
      const locationId = locationData.id;

      // Create alert (or update if exists)
      const { data: alertData, error: alertError } = await supabase
        .from("alerts")
        .upsert({
          user_id: userId,
          location_id: locationId,
          active: true
        }, { onConflict: ['user_id', 'location_id'] })
        .select('unsubscribe_token')
        .single();

      if (alertError) throw alertError;

      const unsubscribeToken = alertData?.unsubscribe_token;
      const unsubscribeLink = unsubscribeToken 
        ? `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
        : '';

      // Send confirmation email
      const emailResult = await sendEmail({
        to: email,
        subject: `Moon Gazing Alert Subscription for ${location}`,
        html: `
          <h1>Moon Gazing Alerts Subscribed!</h1>
          <p>You've been subscribed to moon gazing alerts for ${location}.</p>
          <p>You'll receive emails when conditions are optimal for moon gazing.</p>
          <p>Thank you for using Moongaz.ing!</p>
          ${unsubscribeLink ? `<p><a href="${unsubscribeLink}">Unsubscribe from this location</a></p>` : ''}
        `,
      });

      if (emailResult.success) {
        setMessage("Subscription confirmed! You'll receive alerts via email.");
        setEmail("");
      } else {
        setMessage("Subscription saved! We'll send you a confirmation email shortly.");
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      if (error.code === '23505' && error.message?.includes('alerts_user_id_location_id_key')) {
        setMessage("You're already subscribed to alerts for this location.");
      } else {
        setMessage("Error subscribing. Please try again.");
      }
    }

    setLoading(false);
  };

  return (
    <>
      <h2 className="font-herculanum text-3xl mb-3">Email Alerts</h2>
      <div className="flex flex-col items-center space-y-4">
        <p className="text-center">
          Email me when moon-gazing conditions are optimal for{" "}
          {location
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
          :
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 items-center">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@email.com"
            className="text-indigo-950 py-2 px-4 bg-indigo-100 rounded-xl"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="font-herculanum text-xl bg-yellow-50 text-indigo-800 py-2 px-4 w-32 rounded-full disabled:opacity-50"
          >
            {loading ? "Sending..." : "Subscribe"}
          </button>
        </form>
        {message && <p className="text-center text-sm">{message}</p>}
      </div>
    </>
  );
};

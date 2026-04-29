import { corsHeaders } from "../_shared/cors.ts";

interface ConditionsRequest {
  location?: string | number | null;
  date?: string;
  include?: string;
  elements?: string;
  unitGroup?: "metric" | "us";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { location, date, include, elements, unitGroup = "us" } =
      (await req.json()) as ConditionsRequest;

    if (!location) {
      return new Response(JSON.stringify({ error: "Location is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("VISUAL_CROSSING_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "VISUAL_CROSSING_API_KEY is not configured." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const datePath = date ? `/${date}` : "";
    const params = new URLSearchParams({
      key: apiKey,
      unitGroup,
      contentType: "json",
    });

    if (include) params.append("include", include);
    if (elements) params.append("elements", elements);

    const url =
      `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}${datePath}?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    return new Response(JSON.stringify(data || {}), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

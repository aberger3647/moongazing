import { corsHeaders } from "../_shared/cors.ts";
import { buildTimelineUrl } from "./utils.ts";

interface ConditionsRequest {
  location?: string | number | null;
  date?: string;
  include?: string;
  elements?: string;
  unitGroup?: "metric" | "us";
}

export interface GetConditionsDeps {
  fetch: typeof fetch;
  visualCrossingKey: string | undefined;
}

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function createHandler(deps: GetConditionsDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
      const { location, date, include, elements, unitGroup = "us" } =
        (await req.json()) as ConditionsRequest;
      if (!location) {
        return jsonResponse({ error: "Location is required." }, 400);
      }
      if (!deps.visualCrossingKey) {
        return jsonResponse(
          { error: "VISUAL_CROSSING_API_KEY is not configured." },
          500,
        );
      }

      const url = buildTimelineUrl({
        location: location as string | number,
        date,
        include,
        elements,
        unitGroup,
        apiKey: deps.visualCrossingKey,
      });

      const response = await deps.fetch(url);
      const data = await response.json();
      return jsonResponse(data || {}, response.status);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return jsonResponse({ error: message }, 500);
    }
  };
}

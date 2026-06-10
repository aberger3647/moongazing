import { createHandler } from "./handler.ts";

const handler = createHandler({
  fetch: globalThis.fetch,
  visualCrossingKey: Deno.env.get("VISUAL_CROSSING_API_KEY"),
});

Deno.serve(handler);

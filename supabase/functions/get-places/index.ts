import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";
import { createHandler } from "./handler.ts";

// Fail-closed at request time instead of module-level throw, so a missing env
// var produces a 500 instead of crashing the whole edge-runtime worker.
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

Deno.serve(createHandler({ supabase }));

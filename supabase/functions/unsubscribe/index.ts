import { supabase } from "../_shared/supabase.ts";
import { createHandler } from "./handler.ts";

Deno.serve(createHandler({ supabase }));

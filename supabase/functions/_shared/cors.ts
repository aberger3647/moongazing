// Shared CORS headers for Supabase Edge Functions
// Exported as a plain object so callers can spread into response headers.
// Origin defaults to "*"; set ALLOWED_ORIGIN to lock these endpoints to your site.
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // include credentials only if your client expects them
  // 'Access-Control-Allow-Credentials': 'true',
};

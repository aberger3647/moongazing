// Shared CORS headers for Supabase Edge Functions
// Exported as a plain object so callers can spread into response headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // include credentials only if your client expects them
  // 'Access-Control-Allow-Credentials': 'true',
};

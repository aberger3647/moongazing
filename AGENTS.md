# Moongazing

The runnable product here is the React and Vite frontend. Standard scripts are `npm run dev`,
`npm run build`, `npm run lint`, and `npm run test`.

Use `CLAUDE.md` only for backend architecture or an explicitly requested Docker, Supabase, or
Dokploy operation. Frontend-only work does not require the deployment guide.

## Environment and backend boundaries

The frontend requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
`VITE_GET_PLACES_FUNCTION`. They are normally injected by the environment. If a fresh server
process does not inherit them, create a gitignored local environment file without printing or
committing the values.

The backend described in `CLAUDE.md` does not run in this Cloud VM. Do not try to run local Docker,
Deno, migrations, or Edge Function deployments here. The configured public backend is reachable,
so city search, conditions, and dark-sky-place flows can be verified against live read APIs.

## Verification and completion

Frontend tests and local builds may be run, fixed, and rerun without asking at each step. Start with
the focused component, hook, or browser flow for the changed behavior, then run the relevant build,
lint, and test scripts. Do not mutate shared backend data or deploy unless that operation was
explicitly requested.

The task is done when the requested UI or forecast behavior works through the real frontend,
relevant checks pass, required environment handling is documented without exposing secrets, and the
final diff contains no unrelated changes.

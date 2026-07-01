# AGENTS.md

See `CLAUDE.md` for the full project overview and the (production) Docker/dokploy
backend deployment details.

## Cursor Cloud specific instructions

### What runs here
The runnable product in the Cloud VM is the **React + Vite frontend** (`src/`).
Standard scripts are in `package.json`: `npm run dev`, `npm run build`,
`npm run lint`, `npm run test`.

The backend stack described in `CLAUDE.md` (Supabase edge functions, Postgres,
Docker/dokploy) does **not** run in the Cloud VM — that lived on the original
author's machine. There is no Docker or Deno here. Do not try to `docker ps`,
deploy edge functions, or run migrations locally.

### Frontend env vars (required — the app crashes without them)
The frontend reads `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
`VITE_GET_PLACES_FUNCTION` via `import.meta.env`. These are provided as injected
secrets. Two non-obvious gotchas:

- If they are missing, the page renders a **blank white screen** with an
  `Uncaught Error: supabaseClient is undefined` in the console (from
  `src/supabaseClient.ts`).
- A dev server started inside a fresh `tmux`/login shell may **not inherit** the
  injected secret env vars. The reliable fix is a gitignored `.env` file at the
  repo root containing those three `VITE_*` values (Vite always loads `.env`
  regardless of shell). Create it from the injected env before `npm run dev`:
  ```bash
  { echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL"; \
    echo "VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY"; \
    echo "VITE_GET_PLACES_FUNCTION=$VITE_GET_PLACES_FUNCTION"; } > .env
  ```

### Backend connectivity
`VITE_SUPABASE_URL` points at the live self-hosted backend (the public domain
noted in `CLAUDE.md`), which **is reachable from the Cloud VM**. So the
city search (weather/sky conditions via `get-conditions`) and the nearby
"Dark Sky Places" list (`get-places`) work end-to-end against real data. Kong
requires the `apikey` header; the frontend sends it automatically.

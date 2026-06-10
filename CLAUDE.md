# moongazing

Moon / dark-sky viewing-alert app: a React + Vite + Tailwind frontend (`src/`) and
self-hosted Supabase Edge Functions (`supabase/functions/`, Deno). Users save
locations and get emailed when the moon/weather is good; alerts fire from a daily
`pg_cron` job.

## ⚠️ Deployment & infrastructure — READ FIRST

**Production runs entirely as LOCAL Docker containers on THIS machine** (the box
you're running on), orchestrated by **dokploy** on **Docker Swarm**. There is **no
remote server**, and you need **no SSH, credentials, or Supabase CLI**. The public
domain `https://supabase.csbod.com` is just `dokploy-traefik` (ports 80/443 here)
routing back to the local Kong → edge-runtime.

> If a task touches the live backend, **run `docker ps` first.** Don't assume
> anything is unreachable because it's "self-hosted" or has a public domain — it's
> all here. (This file exists because an agent once mistook this for a remote host
> and stopped.)

Containers (Swarm tasks are named `<service>.1.<taskid>`; the `cf-supabase-*` ones
are plain compose names and `docker exec`/`docker cp` work directly):
- `cf-supabase-dygaax-supabase-edge-functions` — Deno edge runtime
- `cf-supabase-dygaax-supabase-db` — Postgres 15 (the app DB)
- `cf-supabase-dygaax-supabase-kong` — API gateway (`http://kong:8000` internally)
- `moongazing-frontend-koducv` — the built React static site
- `dokploy-traefik` — public ingress (80/443)

### Deploy edge functions
They are **loose bind-mounted host files**, not in dokploy's DB and **not synced
from git** — the host dir `/etc/dokploy/compose/cf-supabase-dygaax/files/volumes/functions`
is mounted to `/home/deno/functions`. Keep git as the canonical copy and push edits
through the container (the dir is `root:root`, so write via the daemon):

```bash
EF=cf-supabase-dygaax-supabase-edge-functions
# _shared/* is imported by every function — copy it whenever it changes
docker cp ./supabase/functions/_shared/.        $EF:/home/deno/functions/_shared/
docker cp ./supabase/functions/<fn>/index.ts    $EF:/home/deno/functions/<fn>/index.ts
docker restart $EF        # optional; the main router hot-loads per request
```
Before overwriting, confirm the live copy matches git (they can drift since this is
hand-synced): `diff <(git show <ref>:supabase/functions/<f>) <(docker exec $EF cat /home/deno/functions/<f>)`.

### Run a DB migration
```bash
docker exec -i cf-supabase-dygaax-supabase-db \
  psql -U postgres -d postgres --single-transaction -v ON_ERROR_STOP=1 -f - < file.sql
```
Superuser via trust auth inside the container (no password). `schema.sql` is the
canonical schema (`CREATE TABLE IF NOT EXISTS`); `migrate.sql` is a destructive
reset; standalone `alter-*.sql` files are idempotent migrations for the live DB.

### Smoke-test a function from the host
```bash
ANON=$(docker exec $EF sh -c 'echo -n $SUPABASE_ANON_KEY')
curl -sk -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  https://supabase.csbod.com/functions/v1/<fn>
```
Kong requires the `apikey` header even though these functions run with
`verify_jwt=false`. Test mutating endpoints with **invalid** tokens (expect 400/404)
so you don't change real data.

### Frontend
`moongazing-frontend-koducv` is a dokploy app with **`autoDeploy=true`** on branch
`main` from GitHub (`git@github.com:aberger3647/moongazing.git`, buildType
`railpack`). So **`git push origin main` auto-rebuilds and redeploys the frontend**
via webhook — no manual step. This repo uses **direct-to-main** (solo, no PR flow).
A frontend push does NOT deploy edge functions (do those manually, above).

### Gotchas
- `supabase/.temp` (gitignored) may cache a stale link to a Supabase **Cloud**
  project — that is NOT the live backend. The real backend is the local
  `cf-supabase-dygaax` stack. Never `supabase functions deploy` to the cloud project.
- Alerts: a `pg_cron` job (10:15 UTC daily) calls `app_private.invoke_send_moon_alerts()`,
  which POSTs `…/functions/v1/send-moon-alerts` with a service-role key from
  `vault.decrypted_secrets`. Email goes out via **Resend** from `alerts@alerts.moongaz.ing`.

## Dev
- `npm run dev` / `npm run build` (Vite) / `npm run lint` (eslint).
- `tsconfig.json` only includes `src/**`, so the Deno edge functions aren't
  typechecked by the frontend `tsc`.
- Known pre-existing nit: `src/types/index.ts` imports `./VisualCrossing` while the
  file is `visualcrossing.ts` (case mismatch `tsc` flags on Linux; builds anyway
  because it's a type-only import esbuild erases).

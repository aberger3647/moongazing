#!/usr/bin/env bash
# Runs the Deno test suites for the edge functions.
# Requires `deno` on PATH (see https://deno.land/install).
set -euo pipefail
cd "$(dirname "$0")"
# --allow-env: read env in cors.ts / supabase.ts
# --allow-net: open to localhost-ish + needed for some npm package resolution
# --no-check: edge functions use loose types intentionally; skip strict tsc
exec deno test --allow-env --allow-read --allow-net --no-check "$@"

// Small testing utilities shared by edge-function unit tests.
// These avoid pulling in a real Supabase client or hitting the network.

type QueryResult = { data: unknown; error: unknown };

export type QueryResponder = (ctx: QueryCallContext) => QueryResult | Promise<QueryResult>;

interface QueryCallContext {
  table: string;
  ops: Array<{ method: string; args: unknown[] }>;
}

export interface MockSupabaseOptions {
  // Per-table responder: receives the recorded chain of method calls and
  // returns the {data, error} value the query's terminator should resolve to.
  // The terminator is whichever of `.single()` / `.maybeSingle()` is called,
  // or the implicit terminator when the builder is awaited directly.
  tables?: Record<string, QueryResponder>;
  rpc?: (name: string, args: unknown) => QueryResult | Promise<QueryResult>;
}

export interface MockSupabase {
  client: {
    from: (table: string) => any;
    rpc: (name: string, args: unknown) => Promise<QueryResult>;
  };
  calls: {
    from: Array<{ table: string; ops: QueryCallContext["ops"] }>;
    rpc: Array<{ name: string; args: unknown }>;
  };
}

// Builds a fluent Supabase-like stub. Every chained method records its call
// and returns `this`; awaiting the builder (or calling `.single()`) consumes
// the table responder.
export function makeMockSupabase(opts: MockSupabaseOptions = {}): MockSupabase {
  const calls: MockSupabase["calls"] = { from: [], rpc: [] };

  const createBuilder = (table: string) => {
    const ctx: QueryCallContext = { table, ops: [] };

    const resolve = async () => {
      const responder = opts.tables?.[table];
      if (!responder) return { data: null, error: null };
      return await responder(ctx);
    };

    const builder: any = {
      then: (onFulfilled: (value: QueryResult) => unknown, onRejected?: any) =>
        resolve().then(onFulfilled, onRejected),
      catch: (onRejected: any) => resolve().catch(onRejected),
    };

    const methods = [
      "select",
      "insert",
      "upsert",
      "update",
      "delete",
      "eq",
      "neq",
      "in",
      "is",
      "match",
      "order",
      "limit",
      "single",
      "maybeSingle",
    ];
    for (const m of methods) {
      builder[m] = (...args: unknown[]) => {
        ctx.ops.push({ method: m, args });
        // Both `.single()` and `.maybeSingle()` may be awaited directly OR
        // followed by more chaining (rare). Return the builder so either works.
        return builder;
      };
    }

    return { builder, ctx };
  };

  const client = {
    from: (table: string) => {
      const { builder, ctx } = createBuilder(table);
      calls.from.push({ table, ops: ctx.ops });
      return builder;
    },
    rpc: async (name: string, args: unknown) => {
      calls.rpc.push({ name, args });
      if (!opts.rpc) return { data: null, error: null };
      return await opts.rpc(name, args);
    },
  };

  return { client, calls };
}

export interface MockedFetch {
  fn: (...args: Parameters<typeof fetch>) => Promise<Response>;
  calls: Array<{ url: string; init?: RequestInit }>;
  install: () => void;
  restore: () => void;
}

// Installs a fetch mock that responds with the provided queue of responses,
// one per call. Each entry is either a Response or a (req) => Response.
export function mockFetch(
  responses: Array<Response | ((url: string, init?: RequestInit) => Response | Promise<Response>)>,
): MockedFetch {
  const original = globalThis.fetch;
  const calls: MockedFetch["calls"] = [];
  let idx = 0;

  const fn: typeof fetch = async (input, init) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;
    calls.push({ url, init });

    const entry = responses[idx++];
    if (!entry) {
      throw new Error(
        `mockFetch: unexpected call #${idx} to ${url} (only ${responses.length} responses queued)`,
      );
    }
    return typeof entry === "function" ? await entry(url, init) : entry;
  };

  return {
    fn,
    calls,
    install: () => {
      globalThis.fetch = fn;
    },
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

// JSON Response convenience.
export const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });

// Build a Request for handler tests.
export const makeRequest = (
  method: string,
  url: string,
  body?: unknown,
): Request => {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new Request(url, init);
};

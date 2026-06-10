import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.stubEnv("VITE_SUPABASE_URL", "https://supabase.test.local");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");

// jsdom doesn't implement these; stub them so components that call them
// during effects don't throw unhandled errors that crash the test runner.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
// jsdom's window.confirm exists but returns false. Default to true so
// confirmation-gated flows can be exercised; individual tests can vi.spyOn it.
if (typeof window !== "undefined") {
  window.confirm = () => true;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

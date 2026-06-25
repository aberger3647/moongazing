import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useSkyParallax } from "./useSkyParallax";

// jsdom has no matchMedia; build one whose `matches` is decided per query.
const matchMediaMock = (matches: (query: string) => boolean) =>
  vi.fn().mockImplementation((query: string) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

// Make the rAF lerp resolve synchronously so a single dispatch settles in-test.
const stubSyncRaf = () => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSkyParallax", () => {
  it("is inert under prefers-reduced-motion: no listeners, no writes", () => {
    vi.stubGlobal("matchMedia", matchMediaMock((q) => q.includes("reduce")));
    const addSpy = vi.spyOn(window, "addEventListener");
    const el = document.createElement("div");
    const setProp = vi.spyOn(el.style, "setProperty");

    renderHook(() => useSkyParallax({ current: el }));

    const listened = addSpy.mock.calls.map((c) => c[0]);
    expect(listened).not.toContain("pointermove");
    expect(listened).not.toContain("scroll");
    expect(setProp).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it("writes a smoothed pointer vector to the root on pointermove", () => {
    vi.stubGlobal("matchMedia", matchMediaMock(() => false));
    stubSyncRaf();
    const el = document.createElement("div");

    renderHook(() => useSkyParallax({ current: el }));

    act(() => {
      window.dispatchEvent(
        new MouseEvent("pointermove", { clientX: window.innerWidth, clientY: 0 }),
      );
    });

    const mx = el.style.getPropertyValue("--mx");
    expect(mx).not.toBe("");
    expect(Number(mx)).not.toBe(0); // the field moved toward the pointer
    expect(el.style.getPropertyValue("--my")).not.toBe("");
  });

  it("removes its listeners on unmount", () => {
    vi.stubGlobal("matchMedia", matchMediaMock(() => false));
    stubSyncRaf();
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const el = document.createElement("div");

    const { unmount } = renderHook(() => useSkyParallax({ current: el }));
    unmount();

    const removed = removeSpy.mock.calls.map((c) => c[0]);
    expect(removed).toContain("pointermove");
    expect(removed).toContain("scroll");
    removeSpy.mockRestore();
  });
});

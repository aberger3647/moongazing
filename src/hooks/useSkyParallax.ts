import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Turns the flat sky into a window with depth that reacts to the viewer. It writes three
// inherited CSS custom properties on the sky root — `--mx`/`--my` (a smoothed pointer or
// tilt vector in roughly [-1, 1]) and `--scroll` (0 at the top, 1 a viewport down) — and
// the CSS does the rest: each depth layer translates by `--mx`/`--my` scaled by its own
// `--depth`, and the whole field recedes by `--scroll`. Motion is smoothed in a single
// requestAnimationFrame loop that wakes on input and stops the moment it settles, so an
// idle sky costs nothing. The whole thing is inert under `prefers-reduced-motion`.

const LERP = 0.12; // per-frame approach to target; lower = silkier, slower
const EPS = 0.0005; // settle threshold — below this we snap and stop the loop
const TILT_RANGE = 25; // degrees of device tilt mapped to the full -1..1 range

type DeviceOrientationConstructor = {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};

interface SkyParallax {
  /** True on touch devices that can offer tilt — gate the opt-in affordance on this. */
  gyroAvailable: boolean;
  /** True once device-orientation tilt is actively driving the sky. */
  gyroEnabled: boolean;
  /** Call from a user gesture (handles the iOS permission prompt) to start tilt. */
  enableGyro: () => void;
}

const GYRO_KEY = "sky-gyro";

export function useSkyParallax(ref: RefObject<HTMLElement | null>): SkyParallax {
  const [gyroAvailable, setGyroAvailable] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);

  // All loop state lives in one ref so handlers and the rAF tick share it without
  // re-subscribing on every render.
  const io = useRef({
    target: { mx: 0, my: 0, scroll: 0 },
    current: { mx: 0, my: 0, scroll: 0 },
    written: { mx: "", my: "", scroll: "" },
    raf: 0,
    running: false,
    vw: 1,
    vh: 1,
    neutral: null as { beta: number; gamma: number } | null,
  });

  // enableGyro's real body is wired up inside the effect; the returned function stays
  // stable across renders by bouncing through this ref.
  const enableGyroImpl = useRef<() => void>(() => {});

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // still sky — attach nothing, write nothing

    const s = io.current;

    const measure = () => {
      s.vw = window.innerWidth || 1;
      s.vh = window.innerHeight || 1;
    };
    measure();

    // Write only the channels that actually changed (rounded), to avoid touching the
    // style object 60×/s for values the compositor can't tell apart.
    const write = () => {
      const el = ref.current;
      if (!el) return;
      const mx = s.current.mx.toFixed(4);
      const my = s.current.my.toFixed(4);
      const scroll = s.current.scroll.toFixed(4);
      if (mx !== s.written.mx) el.style.setProperty("--mx", (s.written.mx = mx));
      if (my !== s.written.my) el.style.setProperty("--my", (s.written.my = my));
      if (scroll !== s.written.scroll)
        el.style.setProperty("--scroll", (s.written.scroll = scroll));
    };

    const tick = () => {
      const { current: c, target: t } = s;
      c.mx += (t.mx - c.mx) * LERP;
      c.my += (t.my - c.my) * LERP;
      c.scroll += (t.scroll - c.scroll) * LERP;
      const settled =
        Math.abs(t.mx - c.mx) < EPS &&
        Math.abs(t.my - c.my) < EPS &&
        Math.abs(t.scroll - c.scroll) < EPS;
      if (settled) {
        c.mx = t.mx;
        c.my = t.my;
        c.scroll = t.scroll;
        write();
        s.running = false;
        s.raf = 0;
        return;
      }
      write();
      s.raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (s.running) return;
      if (typeof requestAnimationFrame !== "function") {
        // No rAF (jsdom): apply instantly so behaviour is still observable.
        s.current = { ...s.target };
        write();
        return;
      }
      s.running = true;
      s.raf = requestAnimationFrame(tick);
    };

    const onPointer = (e: PointerEvent) => {
      // -1..1 from the viewport centre; deliberately not clamped so corners read fully.
      s.target.mx = (e.clientX / s.vw) * 2 - 1;
      s.target.my = (e.clientY / s.vh) * 2 - 1;
      wake();
    };

    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      s.target.scroll = Math.min(Math.max(y / s.vh, 0), 1);
      wake();
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (s.raf) cancelAnimationFrame(s.raf);
        s.raf = 0;
        s.running = false;
      } else {
        // Don't lerp across a long hidden gap — snap to where we were heading.
        s.current = { ...s.target };
        write();
      }
    };

    // ---- Device-orientation tilt (opt-in) ----
    let gyroAttached = false;

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      // First reading becomes "level" — people hold phones at any angle.
      if (!s.neutral) s.neutral = { beta: e.beta, gamma: e.gamma };
      const dGamma = e.gamma - s.neutral.gamma; // device left-right
      const dBeta = e.beta - s.neutral.beta; // device front-back
      // Rotate the tilt vector into screen space so it feels right in landscape.
      const legacy = (window as Window & { orientation?: number }).orientation;
      const angle =
        window.screen?.orientation?.angle ??
        (typeof legacy === "number" ? (legacy + 360) % 360 : 0);
      let gx = dGamma;
      let gy = dBeta;
      if (angle === 90) {
        gx = dBeta;
        gy = -dGamma;
      } else if (angle === 270) {
        gx = -dBeta;
        gy = dGamma;
      } else if (angle === 180) {
        gx = -dGamma;
        gy = -dBeta;
      }
      s.target.mx = Math.min(Math.max(gx / TILT_RANGE, -1), 1);
      s.target.my = Math.min(Math.max(gy / TILT_RANGE, -1), 1);
      wake();
    };

    const attachGyro = () => {
      if (gyroAttached) return;
      gyroAttached = true;
      s.neutral = null; // recapture level on each (re)enable
      window.addEventListener("deviceorientation", onOrient);
    };

    const persist = () => {
      try {
        localStorage.setItem(GYRO_KEY, "1");
      } catch {
        /* private mode / disabled storage — non-fatal */
      }
    };

    const doe =
      typeof DeviceOrientationEvent !== "undefined"
        ? (DeviceOrientationEvent as unknown as DeviceOrientationConstructor)
        : undefined;
    const needsPermission = typeof doe?.requestPermission === "function";

    enableGyroImpl.current = () => {
      if (needsPermission) {
        doe!
          .requestPermission!()
          .then((res) => {
            if (res === "granted") {
              attachGyro();
              setGyroEnabled(true);
              persist();
            }
          })
          .catch(() => {
            /* user declined — stay on pointer/scroll */
          });
      } else {
        attachGyro();
        setGyroEnabled(true);
        persist();
      }
    };

    // Offer tilt only where it can work: a coarse pointer with orientation support.
    const coarse =
      typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const available = coarse && !!doe;
    if (available) setGyroAvailable(true);

    // Re-arm a prior opt-in automatically only where no gesture-gated permission is
    // required (Android); iOS must re-prompt from a fresh tap each load.
    try {
      if (available && !needsPermission && localStorage.getItem(GYRO_KEY) === "1") {
        attachGyro();
        setGyroEnabled(true);
      }
    } catch {
      /* storage unavailable — ignore */
    }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (gyroAttached) window.removeEventListener("deviceorientation", onOrient);
      if (s.raf && typeof cancelAnimationFrame === "function") cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.running = false;
    };
  }, [ref]);

  const enableGyro = useCallback(() => enableGyroImpl.current(), []);
  return { gyroAvailable, gyroEnabled, enableGyro };
}

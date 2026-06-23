import { Link } from "react-router-dom";

// Rendered as the router's errorElement, which replaces the whole Layout (and
// its animated sky) — so this page paints its own night-sky background.
export const NotFound = () => {
  return (
    <main
      className="relative flex min-h-screen w-full flex-col items-center justify-center px-5 text-center text-ink"
      style={{
        background:
          "linear-gradient(180deg, #07071c 0%, #0f0f30 42%, #181747 74%, #232255 100%)",
      }}
    >
      <img
        src="/new_moon.svg"
        alt=""
        aria-hidden="true"
        width={112}
        height={112}
        className="h-28 w-28"
        style={{ filter: "drop-shadow(0 0 30px rgba(124, 132, 196, 0.55))" }}
      />
      <p className="mt-8 font-herculanum text-6xl tracking-display sm:text-7xl">404</p>
      <h1 className="mt-3 font-herculanum text-2xl sm:text-3xl">Lost in the dark</h1>
      <p className="mt-3 max-w-sm text-ink-soft">
        This page is below the horizon. Let&rsquo;s get you back under open sky.
      </p>
      <Link to="/" className="btn btn-primary mt-9">
        Return home
      </Link>
    </main>
  );
};

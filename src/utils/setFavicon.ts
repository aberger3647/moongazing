import type { MoonPhase } from "../types/MoonPhase";
import { moonSvgs } from "./moonSvgs";

export function setFavicon(phase: MoonPhase) {
  const link =
    document.querySelector<HTMLLinkElement>("link[rel~='icon']") ||
    document.createElement("link");

  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = moonSvgs[phase];

  document.head.appendChild(link);
}

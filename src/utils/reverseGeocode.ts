// Turn a coordinate pair into the nearest human-readable place label
// ("Austin, Texas"). Used by "Use my current location": the browser only gives
// us lat/lng, and Visual Crossing echoes that raw "lat,lng" string straight back
// as its resolvedAddress, so without this the UI would show coordinates instead
// of a city name.
//
// BigDataCloud's reverse-geocode-client endpoint is keyless, CORS-enabled, and
// meant for browser use. Returns null on any failure (network, timeout, no
// match) so callers can fall back to the coordinates.
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  // Don't let a slow lookup hang the "Detecting your location…" state.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();

    // Prefer the city; fall back to a smaller locality, then the region. In
    // remote areas BigDataCloud returns the nearest populated place, which is
    // exactly the "nearest city" we want.
    const city: string = data.city || data.locality || "";
    const region: string = data.principalSubdivision || "";

    if (city) return region && region !== city ? `${city}, ${region}` : city;
    // No city/locality (e.g. open ocean): fall back to the region alone.
    return region || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

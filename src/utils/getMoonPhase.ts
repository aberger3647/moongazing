import { getConditions } from "./getConditions";

export async function getMoonPhase(location: string): Promise<number | null> {
  try {
    const data = await getConditions({
      location,
      include: "days",
      elements: "moonphase",
    });

    const moon = data?.days?.[0]?.moonphase;
    return typeof moon === "number" ? moon : null;
  } catch (err) {
    console.error("Error fetching moonphase:", err);
    return null;
  }
}

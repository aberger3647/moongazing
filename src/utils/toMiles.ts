type DistanceUnit = "km" | "m";

export function toMiles(distance: number, unit: DistanceUnit = "m", ): number {
    let miles: number;
    if (unit === "km") {
        miles = distance * 0.621371;
    } else if (unit === "m") {
        miles = distance * 0.000621371;
    } else {
        throw new Error("Invalid unit. Use 'km' or 'm'.");
    }
    return Math.floor(miles);
}

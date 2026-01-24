/**
 * Temperature-related constants and utilities
 * Centralized configuration to avoid duplicating threshold logic
 */

// Single source of truth for temperature levels
const TEMPERATURE_LEVELS = [
    { threshold: 100, text: "text-red-500", bg: "bg-red-500", emoji: "🔥", flame: false },
    { threshold: 90, text: "temperature-flame", bg: "bg-red-500", emoji: "🔥", flame: true },
    { threshold: 75, text: "text-red-400", bg: "bg-red-400", emoji: "🥵", flame: false },
    { threshold: 60, text: "text-orange-400", bg: "bg-orange-400", emoji: "🌡️", flame: false },
    { threshold: 45, text: "text-amber-400", bg: "bg-amber-400", emoji: "🔶", flame: false },
    { threshold: 30, text: "text-yellow-400", bg: "bg-yellow-400", emoji: "🙂", flame: false },
    { threshold: 20, text: "text-lime-400", bg: "bg-lime-400", emoji: "🌤️", flame: false },
    { threshold: 10, text: "text-teal-300", bg: "bg-teal-300", emoji: "💨", flame: false },
    { threshold: 0.01, text: "text-sky-300", bg: "bg-sky-300", emoji: "🧊", flame: false },
    { threshold: -Infinity, text: "text-cyan-400", bg: "bg-cyan-400", emoji: "❄️", flame: false },
] as const;

export const NEAR_MAX_TEMPERATURE = 90;

// Temperature marks for progress bar display
export const TEMPERATURE_MARKS = [
    { value: 0, label: "Froid", align: "left" as const },
    { value: 30, label: "Moyen" },
    { value: 60, label: "Chaud" },
    { value: 80, label: "Brûlant" },
];

/**
 * Find the temperature level for a given value
 */
function getLevel(temperature: number) {
    return TEMPERATURE_LEVELS.find((l) => temperature >= l.threshold) ?? TEMPERATURE_LEVELS.at(-1)!;
}

/**
 * Get Tailwind text color class for a temperature value
 */
export function getTemperatureTextColor(temperature: number): string {
    return getLevel(temperature).text;
}

/**
 * Get Tailwind background color class for a temperature bar
 */
export function getTemperatureBarColor(temperature: number, enableTrail = false): string {
    if (enableTrail && temperature >= NEAR_MAX_TEMPERATURE) {
        return "temperature-trail";
    }
    return getLevel(temperature).bg;
}

/**
 * Get emoji for a temperature value
 */
export function getTemperatureEmoji(temperature: number): string {
    return getLevel(temperature).emoji;
}

/**
 * Format temperature as string with degree symbol
 */
export function formatTemperature(temperature: number): string {
    return `${temperature.toFixed(1)}°C`;
}

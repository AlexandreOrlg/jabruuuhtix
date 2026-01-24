/**
 * Application-wide constants
 */

// UI constants for temperature visualization
export const TEMPERATURE_BAR = {
    MAX_HEIGHT: 40,
    MIN_WIDTH: 3,
    MAX_WIDTH: 12,
    GAP: 4,
    CONTAINER_WIDTH: 240,
} as const;

// Game rules
export const GAME_RULES = {
    MAX_PLAYER_NAME_LENGTH: 15,
    MIN_WORD_LENGTH: 3,
    LATEST_GUESSES_COUNT: 20,
} as const;

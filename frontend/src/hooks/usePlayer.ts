import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const PLAYER_ID_KEY = "Jabruuuhtix_player_id";
const PLAYER_NAME_KEY = "Jabruuuhtix_player_name";

export function usePlayer() {
    // Get or create player ID
    const [playerId] = useState(() => {
        const stored = localStorage.getItem(PLAYER_ID_KEY);
        if (stored) return stored;

        const newId = uuidv4();
        localStorage.setItem(PLAYER_ID_KEY, newId);
        return newId;
    });

    // Get stored player name
    const [playerName, setPlayerNameState] = useState(() => {
        return localStorage.getItem(PLAYER_NAME_KEY) || "";
    });

    // Update player name
    const setPlayerName = useCallback((name: string) => {
        const trimmedName = name.slice(0, 32);
        localStorage.setItem(PLAYER_NAME_KEY, trimmedName);
        setPlayerNameState(trimmedName);
    }, []);

    return {
        playerId,
        playerName,
        setPlayerName,
    };
}

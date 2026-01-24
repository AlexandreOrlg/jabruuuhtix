import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "@/models/Room";

interface UseAutoJoinOptions {
    room: Room | null;
    playerName: string;
    isLoading: boolean;
    joinRoom: (code: string) => Promise<boolean>;
}

interface UseAutoJoinReturn {
    pendingRoomCode: string | null;
    clearPendingRoomCode: () => void;
}

/**
 * Handles auto-joining a room from URL on initial load.
 * Separated from App.tsx for clarity.
 */
export function useAutoJoin({
    room,
    playerName,
    isLoading,
    joinRoom,
}: UseAutoJoinOptions): UseAutoJoinReturn {
    const hasStoredPlayerNameRef = useRef(Boolean(playerName.trim()));
    const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);
    const hasHandledInitialRef = useRef(false);

    // Extract room code from URL on mount
    useEffect(() => {
        if (hasHandledInitialRef.current || room) return;

        const urlParams = new URLSearchParams(window.location.search);
        const codeFromUrl = urlParams.get("room");

        if (codeFromUrl) {
            setPendingRoomCode(codeFromUrl.toUpperCase());
        }
        hasHandledInitialRef.current = true;
    }, [room]);

    // Auto-join room once player name is set
    useEffect(() => {
        if (!pendingRoomCode || room || !playerName.trim() || isLoading) return;
        if (!hasStoredPlayerNameRef.current) return;

        let cancelled = false;

        const attemptJoin = async () => {
            await joinRoom(pendingRoomCode);
            if (cancelled) return;
            setPendingRoomCode(null);
        };

        attemptJoin();

        return () => {
            cancelled = true;
        };
    }, [pendingRoomCode, room, playerName, joinRoom, isLoading]);

    const clearPendingRoomCode = useCallback(() => {
        setPendingRoomCode(null);
    }, []);

    return {
        pendingRoomCode,
        clearPendingRoomCode,
    };
}

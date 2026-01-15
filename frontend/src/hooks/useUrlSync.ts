import { useEffect, useRef, useState } from "react";

export function useUrlSync(roomCode: string | null): string | null {
    const [initialRoomCode] = useState<string | null>(() => {
        const url = new URL(window.location.href);
        return url.searchParams.get("room");
    });
    const hasSyncedRoomRef = useRef(false);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (roomCode) {
            hasSyncedRoomRef.current = true;
            url.searchParams.set("room", roomCode);
        } else {
            if (!hasSyncedRoomRef.current) return;
            url.searchParams.delete("room");
        }
        window.history.replaceState({}, "", url.toString());
    }, [roomCode]);

    return initialRoomCode;
}

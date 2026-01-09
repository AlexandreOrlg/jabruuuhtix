import { useEffect, useState } from "react";

export function useUrlSync(roomCode: string | null): string | null {
    const [initialRoomCode, setInitialRoomCode] = useState<string | null>(null);

    useEffect(() => {
        const url = new URL(window.location.href);
        setInitialRoomCode(url.searchParams.get("room"));
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (roomCode) {
            url.searchParams.set("room", roomCode);
        } else {
            url.searchParams.delete("room");
        }
        window.history.replaceState({}, "", url.toString());
    }, [roomCode]);

    return initialRoomCode;
}

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GuessData } from "@/models/Guess";
import type { RoomData } from "@/models/Room";
import type { PlayerPresenceData } from "@/models/Player";
import { Guess } from "@/models/Guess";
import { Room } from "@/models/Room";

interface UseRoomRealtimeOptions {
    roomId: string | null;
    playerId: string;
    playerName: string;
    onGuessInsert: (guess: Guess) => void;
    onRoomUpdate: (room: Room) => void;
    onPresenceSync?: (players: PlayerPresenceData[]) => void;
    onPresenceJoin?: (players: PlayerPresenceData[]) => void;
    onPresenceLeave?: (players: PlayerPresenceData[]) => void;
}

function isPlayerPresence(value: unknown): value is PlayerPresenceData {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return typeof candidate.id === "string" && typeof candidate.name === "string";
}

function normalizePresenceList(presences: unknown): PlayerPresenceData[] {
    if (!Array.isArray(presences)) return [];
    const players: PlayerPresenceData[] = [];
    for (const presence of presences) {
        if (isPlayerPresence(presence)) {
            const joinedAt =
                typeof presence.joinedAt === "string" ? presence.joinedAt : undefined;
            players.push({
                id: presence.id,
                name: presence.name,
                joinedAt,
            });
        }
    }
    return players;
}

function normalizePresenceState(state: Record<string, unknown>): PlayerPresenceData[] {
    const players = new Map<string, PlayerPresenceData>();
    for (const presences of Object.values(state)) {
        for (const presence of normalizePresenceList(presences)) {
            players.set(presence.id, presence);
        }
    }
    return Array.from(players.values());
}

export function useRoomRealtime({
    roomId,
    playerId,
    playerName,
    onGuessInsert,
    onRoomUpdate,
    onPresenceSync,
    onPresenceJoin,
    onPresenceLeave,
}: UseRoomRealtimeOptions): void {
    const callbacksRef = useRef({
        onGuessInsert,
        onRoomUpdate,
        onPresenceSync,
        onPresenceJoin,
        onPresenceLeave,
    });

    useEffect(() => {
        callbacksRef.current = {
            onGuessInsert,
            onRoomUpdate,
            onPresenceSync,
            onPresenceJoin,
            onPresenceLeave,
        };
    }, [onGuessInsert, onRoomUpdate, onPresenceSync, onPresenceJoin, onPresenceLeave]);

    useEffect(() => {
        if (!roomId) return;

        const roomChannel: RealtimeChannel = supabase
            .channel(`room:${roomId}`, {
                config: {
                    presence: {
                        key: playerId,
                    },
                },
            })
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "guesses",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const newGuess = Guess.fromApi(payload.new as GuessData);
                    callbacksRef.current.onGuessInsert(newGuess);
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    const updatedRoom = Room.fromApi(payload.new as RoomData);
                    callbacksRef.current.onRoomUpdate(updatedRoom);
                }
            )
            .on("presence", { event: "sync" }, () => {
                const handler = callbacksRef.current.onPresenceSync;
                if (!handler) return;
                const state = roomChannel.presenceState() as Record<string, unknown>;
                handler(normalizePresenceState(state));
            })
            .on("presence", { event: "join" }, (payload) => {
                const handler = callbacksRef.current.onPresenceJoin;
                if (!handler) return;
                const players = normalizePresenceList(
                    (payload as { newPresences?: unknown }).newPresences
                );
                if (players.length > 0) {
                    handler(players);
                }
            })
            .on("presence", { event: "leave" }, (payload) => {
                const handler = callbacksRef.current.onPresenceLeave;
                if (!handler) return;
                const players = normalizePresenceList(
                    (payload as { leftPresences?: unknown }).leftPresences
                );
                if (players.length > 0) {
                    handler(players);
                }
            })
            .subscribe((status) => {
                if (status !== "SUBSCRIBED") return;
                const trimmedName = playerName.trim();
                if (!trimmedName) return;
                roomChannel.track({
                    id: playerId,
                    name: trimmedName,
                    joinedAt: new Date().toISOString(),
                });
            });

        return () => {
            roomChannel.untrack();
            roomChannel.unsubscribe();
        };
    }, [roomId, playerId, playerName]);
}

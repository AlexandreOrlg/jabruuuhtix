import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { GuessData } from "@/models/Guess";
import type { RoomData } from "@/models/Room";
import type { PlayerData } from "@/models/Player";
import { Guess } from "@/models/Guess";
import { Room } from "@/models/Room";

interface UseRoomRealtimeOptions {
    roomId: string | null;
    onGuessInsert: (guess: Guess) => void;
    onRoomUpdate: (room: Room) => void;
    onPresenceSync?: (players: PlayerData[]) => void;
}

export function useRoomRealtime({
    roomId,
    onGuessInsert,
    onRoomUpdate,
    onPresenceSync,
}: UseRoomRealtimeOptions): void {
    const callbacksRef = useRef({
        onGuessInsert,
        onRoomUpdate,
        onPresenceSync,
    });

    useEffect(() => {
        callbacksRef.current = { onGuessInsert, onRoomUpdate, onPresenceSync };
    }, [onGuessInsert, onRoomUpdate, onPresenceSync]);

    useEffect(() => {
        if (!roomId) return;

        const roomChannel: RealtimeChannel = supabase
            .channel(`room:${roomId}`)
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
                if (!callbacksRef.current.onPresenceSync) return;
                const state = roomChannel.presenceState();
                const presentPlayers: PlayerData[] = [];

                for (const key in state) {
                    const presences = state[key] as unknown as Array<{
                        id: string;
                        name: string;
                        joinedAt?: string;
                    }>;

                    for (const presence of presences) {
                        if (presence.id && presence.name) {
                            presentPlayers.push({
                                id: presence.id,
                                name: presence.name,
                                joinedAt: presence.joinedAt,
                            });
                        }
                    }
                }

                callbacksRef.current.onPresenceSync(presentPlayers);
            })
            .subscribe();

        return () => {
            roomChannel.unsubscribe();
        };
    }, [roomId]);
}

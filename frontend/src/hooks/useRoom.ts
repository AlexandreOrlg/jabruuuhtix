import { useState, useEffect, useCallback } from "react";
import { supabase, API_URL } from "@/lib/supabase";
import type {
    Room,
    Guess,
    Player,
    CreateRoomResponse,
    SubmitGuessResponse,
} from "@/lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRoomReturn {
    room: Room | null;
    guesses: Guess[];
    players: Player[];
    isLoading: boolean;
    error: string | null;
    bestScore: number;
    revealedWord: string | null;
    createRoom: (playerName: string) => Promise<CreateRoomResponse | null>;
    joinRoom: (roomCode: string) => Promise<boolean>;
    submitGuess: (
        playerId: string,
        playerName: string,
        word: string
    ) => Promise<SubmitGuessResponse | null>;
    leaveRoom: () => void;
}

export function useRoom(): UseRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [guesses, setGuesses] = useState<Guess[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Compute best score from guesses
    const bestScore =
        guesses.length > 0 ? Math.max(...guesses.map((g) => g.score)) : 0;

    // Revealed word (from room or latest guess)
    const revealedWord = room?.revealed_word ?? null;

    // Subscribe to realtime updates
    useEffect(() => {
        if (!room) return;

        const roomChannel = supabase
            .channel(`room:${room.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "guesses",
                    filter: `room_id=eq.${room.id}`,
                },
                (payload) => {
                    const newGuess = payload.new as Guess;
                    setGuesses((prev) => {
                        // Avoid duplicates
                        if (prev.some((g) => g.id === newGuess.id)) return prev;
                        return [...prev, newGuess].sort((a, b) => {
                            if (b.score !== a.score) return b.score - a.score;
                            return (
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime()
                            );
                        });
                    });
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                    filter: `id=eq.${room.id}`,
                },
                (payload) => {
                    const updatedRoom = payload.new as Room;
                    setRoom(updatedRoom);
                }
            )
            // Presence for player tracking
            .on("presence", { event: "sync" }, () => {
                const state = roomChannel.presenceState();
                const presentPlayers: Player[] = [];

                for (const key in state) {
                    const presences = state[key] as unknown as Array<{ id: string; name: string; joinedAt: string }>;
                    for (const presence of presences) {
                        if (presence.id && presence.name) {
                            presentPlayers.push({
                                id: presence.id,
                                name: presence.name,
                                joinedAt: presence.joinedAt || new Date().toISOString(),
                            });
                        }
                    }
                }

                setPlayers(presentPlayers);
            })
            .subscribe();

        setChannel(roomChannel);

        return () => {
            roomChannel.unsubscribe();
        };
    }, [room?.id]);

    // Create a new room
    const createRoom = useCallback(
        async (playerName: string): Promise<CreateRoomResponse | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_URL}/api/rooms`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playerName }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Failed to create room");
                }

                const data: CreateRoomResponse = await response.json();

                // Fetch the created room
                const { data: roomData, error: roomError } = await supabase
                    .from("rooms")
                    .select("*")
                    .eq("id", data.roomId)
                    .single();

                if (roomError) throw roomError;

                setRoom(roomData);
                setGuesses([]);

                return data;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // Join an existing room
    const joinRoom = useCallback(async (roomCode: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Find room by code
            const { data: roomData, error: roomError } = await supabase
                .from("rooms")
                .select("*")
                .eq("code", roomCode.toUpperCase())
                .single();

            if (roomError || !roomData) {
                throw new Error("Room not found");
            }

            // Load existing guesses
            const { data: guessesData, error: guessesError } = await supabase
                .from("guesses")
                .select("*")
                .eq("room_id", roomData.id)
                .order("score", { ascending: false })
                .order("created_at", { ascending: false });

            if (guessesError) throw guessesError;

            setRoom(roomData);
            setGuesses(guessesData || []);

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Submit a guess
    const submitGuess = useCallback(
        async (
            playerId: string,
            playerName: string,
            word: string
        ): Promise<SubmitGuessResponse | null> => {
            if (!room) {
                setError("Not in a room");
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_URL}/api/guesses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomCode: room.code,
                        playerId,
                        playerName,
                        word,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || "Failed to submit guess");
                }

                const data: SubmitGuessResponse = await response.json();

                // Update room if word was revealed
                if (data.revealedWord) {
                    setRoom((prev) =>
                        prev
                            ? { ...prev, revealed_word: data.revealedWord, status: "finished" }
                            : null
                    );
                }

                return data;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [room]
    );

    // Leave the current room
    const leaveRoom = useCallback(() => {
        if (channel) {
            channel.unsubscribe();
            setChannel(null);
        }
        setRoom(null);
        setGuesses([]);
        setError(null);
    }, [channel]);

    return {
        room,
        guesses,
        players,
        isLoading,
        error,
        bestScore,
        revealedWord,
        createRoom,
        joinRoom,
        submitGuess,
        leaveRoom,
    };
}

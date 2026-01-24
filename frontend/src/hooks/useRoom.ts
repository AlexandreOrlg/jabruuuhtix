import { useCallback, useRef, useState } from "react";
import { createRoom, fetchRoomWithGuessesByCode } from "@/api/rooms";
import { submitGuess } from "@/api/guesses";
import { useGuesses } from "@/hooks/useGuesses";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import type { Guess } from "@/models/Guess";
import type { Room, RoomMode } from "@/models/Room";
import type { PlayerPresenceData } from "@/models/Player";
import type { SubmitGuessResponse } from "@/lib/types";
import { toast } from "@/components/ui/8bit/toast";

interface UseRoomOptions {
    playerId: string;
    playerName: string;
}

interface UseRoomReturn {
    room: Room | null;
    guesses: Guess[];
    submittedWords: Set<string>;
    presentPlayers: PlayerPresenceData[];
    isLoading: boolean;
    error: string | null;
    guessValidationPulse: number;

    createRoom: (mode: RoomMode) => Promise<Room | null>;
    joinRoom: (roomCode: string) => Promise<boolean>;
    submitGuess: (word: string) => Promise<SubmitGuessResponse | null>;
    leaveRoom: () => void;
}

export function useRoom({ playerId, playerName }: UseRoomOptions): UseRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [guessValidationPulse, setGuessValidationPulse] = useState(0);
    const [presentPlayers, setPresentPlayers] = useState<PlayerPresenceData[]>([]);
    const knownPlayersRef = useRef<Set<string>>(new Set());

    const { guesses, addGuess, replaceGuesses, clearGuesses, submittedWords } =
        useGuesses(playerId);



    const handleRoomUpdate = useCallback((updatedRoom: Room) => {
        setRoom(updatedRoom);
    }, []);

    const handleGuessInsert = useCallback(
        (newGuess: Guess) => {
            addGuess(newGuess);
            if (newGuess.isWinning && room?.mode === "coop") {
                setRoom((prev) => (prev ? prev.withRevealedWord(newGuess.word) : prev));
            }
        },
        [addGuess, room?.mode]
    );

    const mergePlayers = useCallback(
        (current: PlayerPresenceData[], incoming: PlayerPresenceData[]) => {
            const merged = new Map<string, PlayerPresenceData>();
            for (const player of current) {
                merged.set(player.id, player);
            }
            for (const player of incoming) {
                merged.set(player.id, player);
            }
            return Array.from(merged.values());
        },
        []
    );

    const handlePresenceSync = useCallback((players: PlayerPresenceData[]) => {
        setPresentPlayers(players);
        knownPlayersRef.current = new Set(players.map((player) => player.id));
    }, []);

    const handlePresenceJoin = useCallback(
        (players: PlayerPresenceData[]) => {
            setPresentPlayers((prev) => mergePlayers(prev, players));
            for (const player of players) {
                if (player.id === playerId) continue;
                if (!knownPlayersRef.current.has(player.id)) {
                    toast(`${player.name} a rejoint la partie !`);
                }
                knownPlayersRef.current.add(player.id);
            }
        },
        [mergePlayers, playerId]
    );

    const handlePresenceLeave = useCallback(
        (players: PlayerPresenceData[]) => {
            const leavingIds = new Set(players.map((player) => player.id));
            setPresentPlayers((prev) => prev.filter((player) => !leavingIds.has(player.id)));
            for (const player of players) {
                if (player.id === playerId) continue;
                if (knownPlayersRef.current.has(player.id)) {
                    toast(`${player.name} a quitte la partie.`);
                }
                knownPlayersRef.current.delete(player.id);
            }
        },
        [playerId]
    );

    useRoomRealtime({
        roomId: room?.id ?? null,
        playerId,
        playerName,
        onGuessInsert: handleGuessInsert,
        onRoomUpdate: handleRoomUpdate,
        onPresenceSync: handlePresenceSync,
        onPresenceJoin: handlePresenceJoin,
        onPresenceLeave: handlePresenceLeave,
    });

    const createRoomHandler = useCallback(
        async (mode: RoomMode): Promise<Room | null> => {
            setIsLoading(true);
            setError(null);

            try {
                const newRoom = await createRoom(playerName, mode);
                setRoom(newRoom);
                replaceGuesses([]);
                setPresentPlayers([]);
                knownPlayersRef.current = new Set();
                return newRoom;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [playerName, replaceGuesses]
    );

    const joinRoomHandler = useCallback(
        async (roomCode: string): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            try {
                const { room: foundRoom, guesses: roomGuesses } =
                    await fetchRoomWithGuessesByCode(roomCode);
                setRoom(foundRoom);
                replaceGuesses(roomGuesses);
                setPresentPlayers([]);
                knownPlayersRef.current = new Set();

                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                setError(message);
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [replaceGuesses]
    );

    const submitGuessHandler = useCallback(
        async (word: string): Promise<SubmitGuessResponse | null> => {
            if (!room) {
                setError("Not in a room");
                return null;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await submitGuess({
                    roomCode: room.code,
                    playerId,
                    playerName,
                    word,
                });

                const revealedWord = data.revealedWord;
                if (revealedWord) {
                    setRoom((prev) => (prev ? prev.withRevealedWord(revealedWord) : prev));
                }

                return data;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                if (
                    message.includes("n'est pas autorisé") ||
                    message.includes("n'existe pas dans le dictionnaire")
                ) {
                    setGuessValidationPulse((prev) => prev + 1);
                    return null;
                }
                setError(message);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [room, playerId, playerName]
    );

    const leaveRoom = useCallback(() => {
        setRoom(null);
        clearGuesses();
        setPresentPlayers([]);
        knownPlayersRef.current = new Set();
        setError(null);
        setGuessValidationPulse(0);
    }, [clearGuesses]);

    return {
        room,
        guesses,
        submittedWords,
        presentPlayers,
        isLoading,
        error,
        guessValidationPulse,

        createRoom: createRoomHandler,
        joinRoom: joinRoomHandler,
        submitGuess: submitGuessHandler,
        leaveRoom,
    };
}

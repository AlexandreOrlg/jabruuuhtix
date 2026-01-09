import { useCallback, useMemo, useState } from "react";
import { createRoom, fetchRoomByCode } from "@/api/rooms";
import { fetchGuessesByRoomId, submitGuess } from "@/api/guesses";
import { useGuesses } from "@/hooks/useGuesses";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { Guess } from "@/models/Guess";
import type { Room } from "@/models/Room";
import type { SubmitGuessResponse } from "@/lib/types";

interface UseRoomOptions {
    playerId: string;
    playerName: string;
}

interface UseRoomReturn {
    room: Room | null;
    guesses: Guess[];
    submittedWords: Set<string>;
    isLoading: boolean;
    error: string | null;
    bestScore: number;
    revealedWord: string | null;
    createRoom: () => Promise<Room | null>;
    joinRoom: (roomCode: string) => Promise<boolean>;
    submitGuess: (word: string) => Promise<SubmitGuessResponse | null>;
    leaveRoom: () => void;
}

export function useRoom({ playerId, playerName }: UseRoomOptions): UseRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { guesses, addGuess, replaceGuesses, clearGuesses, submittedWords } =
        useGuesses(playerId);

    const bestScore = useMemo(() => Guess.getBestScore(guesses), [guesses]);
    const revealedWord = room?.revealedWord ?? null;

    const handleRoomUpdate = useCallback((updatedRoom: Room) => {
        setRoom(updatedRoom);
    }, []);

    const handleGuessInsert = useCallback(
        (newGuess: Guess) => {
            addGuess(newGuess);
        },
        [addGuess]
    );

    useRoomRealtime({
        roomId: room?.id ?? null,
        onGuessInsert: handleGuessInsert,
        onRoomUpdate: handleRoomUpdate,
    });

    const createRoomHandler = useCallback(async (): Promise<Room | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const newRoom = await createRoom(playerName);
            setRoom(newRoom);
            replaceGuesses([]);
            return newRoom;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [playerName, replaceGuesses]);

    const joinRoomHandler = useCallback(
        async (roomCode: string): Promise<boolean> => {
            setIsLoading(true);
            setError(null);

            try {
                const foundRoom = await fetchRoomByCode(roomCode);
                if (!foundRoom) {
                    throw new Error("Room not found");
                }

                const roomGuesses = await fetchGuessesByRoomId(foundRoom.id);
                setRoom(foundRoom);
                replaceGuesses(roomGuesses);

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

                if (data.revealedWord) {
                    setRoom((prev) => (prev ? prev.withRevealedWord(data.revealedWord) : prev));
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
        [room, playerId, playerName]
    );

    const leaveRoom = useCallback(() => {
        setRoom(null);
        clearGuesses();
        setError(null);
    }, [clearGuesses]);

    return {
        room,
        guesses,
        submittedWords,
        isLoading,
        error,
        bestScore,
        revealedWord,
        createRoom: createRoomHandler,
        joinRoom: joinRoomHandler,
        submitGuess: submitGuessHandler,
        leaveRoom,
    };
}

import { useCallback, useMemo, useRef, useState } from "react";
import { createRoom, fetchRoomByCode } from "@/api/rooms";
import { fetchGuessesByRoomId, submitGuess } from "@/api/guesses";
import { useGuesses } from "@/hooks/useGuesses";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { Guess } from "@/models/Guess";
import type { Room } from "@/models/Room";
import type { PlayerData } from "@/models/Player";
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
    presentPlayers: PlayerData[];
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
    const [presentPlayers, setPresentPlayers] = useState<PlayerData[]>([]);
    const knownPlayersRef = useRef<Set<string>>(new Set());

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

    const mergePlayers = useCallback(
        (current: PlayerData[], incoming: PlayerData[]) => {
            const merged = new Map<string, PlayerData>();
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

    const handlePresenceSync = useCallback((players: PlayerData[]) => {
        setPresentPlayers(players);
        knownPlayersRef.current = new Set(players.map((player) => player.id));
    }, []);

    const handlePresenceJoin = useCallback(
        (players: PlayerData[]) => {
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
        (players: PlayerData[]) => {
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

    const createRoomHandler = useCallback(async (): Promise<Room | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const newRoom = await createRoom(playerName);
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
    }, [clearGuesses]);

    return {
        room,
        guesses,
        submittedWords,
        presentPlayers,
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

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Guess } from "@/models/Guess";
import { Player } from "@/models/Player";

export interface PlayerSummary {
    id: string;
    name: string;
    displayName: string;
    bestScore: number;
    guessCount: number;
    isCurrent: boolean;
}

export function usePlayers(guesses: Guess[], currentPlayerId: string): PlayerSummary[] {
    const knownPlayersRef = useRef<Set<string>>(new Set());

    const players = useMemo(() => {
        const playerMap = new Map<string, Player>();

        for (const guess of guesses) {
            if (!playerMap.has(guess.playerId)) {
                playerMap.set(
                    guess.playerId,
                    new Player({
                        id: guess.playerId,
                        name: guess.playerName,
                        joinedAt: guess.createdAt.toISOString(),
                    })
                );
            }
        }

        return Array.from(playerMap.values())
            .map((player) => ({
                id: player.id,
                name: player.name,
                displayName: player.displayName,
                bestScore: player.getBestScore(guesses),
                guessCount: player.getGuessCount(guesses),
                isCurrent: player.isCurrentPlayer(currentPlayerId),
            }))
            .sort((a, b) => b.bestScore - a.bestScore);
    }, [guesses, currentPlayerId]);

    useEffect(() => {
        for (const player of players) {
            if (!knownPlayersRef.current.has(player.id) && !player.isCurrent) {
                toast(`🎮 ${player.name} a rejoint la partie !`);
            }
            knownPlayersRef.current.add(player.id);
        }
    }, [players, toast]);

    return players;
}

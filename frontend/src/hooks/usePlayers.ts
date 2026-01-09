import { useMemo } from "react";
import { Guess } from "@/models/Guess";
import { Player } from "@/models/Player";
import type { PlayerData } from "@/models/Player";

export interface PlayerSummary {
    id: string;
    name: string;
    displayName: string;
    bestScore: number;
    guessCount: number;
    isCurrent: boolean;
}

export function usePlayers(
    guesses: Guess[],
    currentPlayerId: string,
    presentPlayers: PlayerData[] = []
): PlayerSummary[] {
    const players = useMemo(() => {
        const playerMap = new Map<string, Player>();

        for (const player of presentPlayers) {
            if (!playerMap.has(player.id)) {
                playerMap.set(
                    player.id,
                    new Player({
                        id: player.id,
                        name: player.name,
                        joinedAt: player.joinedAt,
                    })
                );
            }
        }

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
    }, [guesses, currentPlayerId, presentPlayers]);

    return players;
}

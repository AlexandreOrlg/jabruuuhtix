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
        const statsByPlayerId = new Map<string, { bestScore: number; guessCount: number }>();

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
            const stats = statsByPlayerId.get(guess.playerId) ?? {
                bestScore: 0,
                guessCount: 0,
            };
            stats.guessCount += 1;
            if (guess.score > stats.bestScore) {
                stats.bestScore = guess.score;
            }
            statsByPlayerId.set(guess.playerId, stats);
        }

        return Array.from(playerMap.values())
            .map((player) => ({
                id: player.id,
                name: player.name,
                displayName: player.displayName,
                bestScore: statsByPlayerId.get(player.id)?.bestScore ?? 0,
                guessCount: statsByPlayerId.get(player.id)?.guessCount ?? 0,
                isCurrent: player.isCurrentPlayer(currentPlayerId),
            }))
            .sort((a, b) => b.bestScore - a.bestScore);
    }, [guesses, currentPlayerId, presentPlayers]);

    return players;
}

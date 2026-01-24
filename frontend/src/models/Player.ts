import type { Guess } from "./Guess";
import { GAME_RULES } from "@/lib/constants";

/**
 * Raw player presence data from Supabase realtime
 */
export interface PlayerPresenceData {
    id: string;
    name: string;
    joinedAt?: string;
}



export class Player {
    readonly id: string;
    readonly name: string;
    readonly joinedAt: Date;

    constructor(data: PlayerPresenceData) {
        this.id = data.id;
        this.name = data.name;
        this.joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
    }

    static fromApi(data: PlayerPresenceData): Player {
        return new Player(data);
    }

    get displayName(): string {
        const maxLength = GAME_RULES.MAX_PLAYER_NAME_LENGTH;
        return this.name.length > maxLength
            ? `${this.name.slice(0, maxLength)}...`
            : this.name;
    }

    isCurrentPlayer(currentPlayerId: string): boolean {
        return this.id === currentPlayerId;
    }

    getBestScore(guesses: Guess[]): number {
        const playerGuesses = guesses.filter((g) => g.playerId === this.id);
        if (playerGuesses.length === 0) return 0;
        return Math.max(...playerGuesses.map((g) => g.score));
    }

    getGuessCount(guesses: Guess[]): number {
        return guesses.filter((g) => g.playerId === this.id).length;
    }
}

/**
 * Player with computed statistics from guesses.
 * Extends Player to inherit displayName and other properties.
 */
export class PlayerWithStats extends Player {
    readonly bestScore: number;
    readonly guessCount: number;
    readonly isCurrent: boolean;

    private constructor(
        data: PlayerPresenceData,
        guesses: Guess[],
        currentPlayerId: string
    ) {
        super(data);
        this.bestScore = this.getBestScore(guesses);
        this.guessCount = this.getGuessCount(guesses);
        this.isCurrent = this.isCurrentPlayer(currentPlayerId);
    }

    /**
     * Create a PlayerWithStats from a Player instance
     */
    static fromPlayer(
        player: Player,
        guesses: Guess[],
        currentPlayerId: string
    ): PlayerWithStats {
        return new PlayerWithStats(
            { id: player.id, name: player.name, joinedAt: player.joinedAt.toISOString() },
            guesses,
            currentPlayerId
        );
    }

    /**
     * Create PlayerWithStats instances from presence data and guesses
     */
    static fromPresenceAndGuesses(
        presenceList: PlayerPresenceData[],
        guesses: Guess[],
        currentPlayerId: string
    ): PlayerWithStats[] {
        const playerMap = new Map<string, PlayerPresenceData>();

        // Add players from presence
        for (const presence of presenceList) {
            if (!playerMap.has(presence.id)) {
                playerMap.set(presence.id, presence);
            }
        }

        // Add players from guesses (in case they left but have guesses)
        for (const guess of guesses) {
            if (!playerMap.has(guess.playerId)) {
                playerMap.set(guess.playerId, {
                    id: guess.playerId,
                    name: guess.playerName,
                    joinedAt: guess.createdAt.toISOString(),
                });
            }
        }

        return Array.from(playerMap.values())
            .map((data) => new PlayerWithStats(data, guesses, currentPlayerId))
            .sort((a, b) => b.bestScore - a.bestScore);
    }
}

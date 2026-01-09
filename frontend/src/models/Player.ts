import type { Guess } from "./Guess";

export interface PlayerData {
    id: string;
    name: string;
    joinedAt?: string;
}

export class Player {
    readonly id: string;
    readonly name: string;
    readonly joinedAt: Date;

    constructor(data: PlayerData) {
        this.id = data.id;
        this.name = data.name;
        this.joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
    }

    static fromApi(data: PlayerData): Player {
        return new Player(data);
    }

    get displayName(): string {
        return this.name.length > 15 ? `${this.name.slice(0, 15)}...` : this.name;
    }

    isCurrentPlayer(currentPlayerId: string): boolean {
        return this.id === currentPlayerId;
    }

    getBestScore(guesses: Guess[]): number {
        const playerGuesses = guesses.filter((guess) => guess.playerId === this.id);
        if (playerGuesses.length === 0) return 0;
        return Math.max(...playerGuesses.map((guess) => guess.score));
    }

    getGuessCount(guesses: Guess[]): number {
        return guesses.filter((guess) => guess.playerId === this.id).length;
    }
}

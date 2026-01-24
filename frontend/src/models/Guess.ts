import {
    getTemperatureTextColor,
    getTemperatureEmoji,
    formatTemperature,
} from "@/lib/temperature";

export interface GuessData {
    id: string;
    room_id: string;
    player_id: string;
    player_name: string;
    word: string;
    score: number;
    rank: number | null;
    temperature: number;
    created_at: string;
}

export class Guess {
    readonly id: string;
    readonly roomId: string;
    readonly playerId: string;
    readonly playerName: string;
    readonly word: string;
    readonly score: number;
    readonly rank: number | null;
    readonly temperature: number;
    readonly createdAt: Date;

    constructor(data: GuessData) {
        this.id = data.id;
        this.roomId = data.room_id;
        this.playerId = data.player_id;
        this.playerName = data.player_name;
        this.word = data.word;
        this.score = data.score;
        this.rank = data.rank;
        this.temperature = data.temperature ?? 0;
        this.createdAt = new Date(data.created_at);
    }

    static fromApi(data: GuessData): Guess {
        return new Guess(data);
    }

    get isWinning(): boolean {
        return this.score === 100;
    }

    belongsTo(playerId: string): boolean {
        return this.playerId === playerId;
    }

    get formattedRank(): string {
        if (this.rank === null) return "-";
        return `${this.rank}‰`;
    }

    get formattedTemperature(): string {
        return formatTemperature(this.temperature);
    }

    get temperatureEmoji(): string {
        return getTemperatureEmoji(this.temperature);
    }

    get temperatureColor(): string {
        return getTemperatureTextColor(this.temperature);
    }



    static sortByScore(guesses: Guess[]): Guess[] {
        return [...guesses].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
    }

    static getBestScore(guesses: Guess[]): number {
        if (guesses.length === 0) return 0;
        return Math.max(...guesses.map((guess) => guess.score));
    }

    static getBestTemperature(guesses: Guess[]): number {
        if (guesses.length === 0) return 0;
        return Math.max(...guesses.map((guess) => guess.temperature));
    }

    static getPlayerWords(guesses: Guess[], playerId: string): Set<string> {
        return new Set(
            guesses
                .filter((guess) => guess.playerId === playerId)
                .map((guess) => guess.word.toLowerCase())
        );
    }
}

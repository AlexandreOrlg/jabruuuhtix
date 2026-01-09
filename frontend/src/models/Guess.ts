export interface GuessData {
    id: string;
    room_id: string;
    player_id: string;
    player_name: string;
    word: string;
    score: number;
    created_at: string;
}

export class Guess {
    readonly id: string;
    readonly roomId: string;
    readonly playerId: string;
    readonly playerName: string;
    readonly word: string;
    readonly score: number;
    readonly createdAt: Date;

    constructor(data: GuessData) {
        this.id = data.id;
        this.roomId = data.room_id;
        this.playerId = data.player_id;
        this.playerName = data.player_name;
        this.word = data.word;
        this.score = data.score;
        this.createdAt = new Date(data.created_at);
    }

    static fromApi(data: GuessData): Guess {
        return new Guess(data);
    }

    get scoreColor(): string {
        return Guess.getScoreColor(this.score);
    }

    get isWinning(): boolean {
        return this.score === 100;
    }

    belongsTo(playerId: string): boolean {
        return this.playerId === playerId;
    }

    get formattedScore(): string {
        return `${this.score}%`;
    }

    static getScoreColor(score: number): string {
        if (score >= 80) return "text-green-400";
        if (score >= 60) return "text-yellow-400";
        if (score >= 40) return "text-orange-400";
        return "text-red-400";
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

    static getPlayerWords(guesses: Guess[], playerId: string): Set<string> {
        return new Set(
            guesses
                .filter((guess) => guess.playerId === playerId)
                .map((guess) => guess.word.toLowerCase())
        );
    }
}

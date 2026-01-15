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
        return `${this.temperature.toFixed(1)}°C`;
    }

    get temperatureEmoji(): string {
        if (this.temperature >= 90) return "🔥";
        if (this.temperature >= 75) return "🥵";
        if (this.temperature >= 60) return "🌡️";
        if (this.temperature >= 45) return "🔶";
        if (this.temperature >= 30) return "🙂";
        if (this.temperature >= 20) return "🌤️";
        if (this.temperature >= 10) return "💨";
        if (this.temperature > 0) return "🧊";
        return "❄️";
    }

    get temperatureColor(): string {
        return Guess.getTemperatureColor(this.temperature);
    }

    static getScoreColor(score: number): string {
        if (score >= 80) return "text-green-400";
        if (score >= 60) return "text-yellow-400";
        if (score >= 40) return "text-orange-400";
        return "text-red-400";
    }

    static getTemperatureColor(temperature: number): string {
        if (temperature >= 90 && temperature < 100) return "temperature-flame";
        if (temperature >= 90) return "text-red-500";
        if (temperature >= 75) return "text-red-400";
        if (temperature >= 60) return "text-orange-400";
        if (temperature >= 45) return "text-amber-400";
        if (temperature >= 30) return "text-yellow-400";
        if (temperature >= 20) return "text-lime-400";
        if (temperature >= 10) return "text-teal-300";
        if (temperature > 0) return "text-sky-300";
        return "text-cyan-400";
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

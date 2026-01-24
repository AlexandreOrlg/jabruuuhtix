import { Guess } from "./Guess";

type SortKey = "temperature" | "time";
type SortOrder = "asc" | "desc";

/**
 * A typed collection of guesses with chainable filtering and sorting methods.
 * Provides a fluent API for working with guess arrays.
 */
export class GuessCollection {
    readonly items: Guess[];

    constructor(items: Guess[]) {
        this.items = items;
    }

    static from(guesses: Guess[]): GuessCollection {
        return new GuessCollection(guesses);
    }

    get length(): number {
        return this.items.length;
    }

    get isEmpty(): boolean {
        return this.items.length === 0;
    }

    /**
     * Filter guesses by player ID
     */
    byPlayer(playerId: string): GuessCollection {
        return new GuessCollection(
            this.items.filter((guess) => guess.belongsTo(playerId))
        );
    }

    /**
     * Generic sort method - replaces sortedByTemperature, sortedByTimeAsc, sortedByTimeDesc
     */
    sortedBy(key: SortKey, order: SortOrder = "desc"): GuessCollection {
        const sorted = [...this.items].sort((a, b) => {
            let diff: number;
            if (key === "temperature") {
                diff = a.temperature - b.temperature;
                // Secondary sort by time for ties
                if (diff === 0) {
                    diff = a.createdAt.getTime() - b.createdAt.getTime();
                }
            } else {
                diff = a.createdAt.getTime() - b.createdAt.getTime();
            }
            return order === "desc" ? -diff : diff;
        });
        return new GuessCollection(sorted);
    }

    /**
     * Get the N most recent guesses
     */
    latest(count: number): GuessCollection {
        return this.sortedBy("time", "desc").take(count);
    }

    /**
     * Take the first N items
     */
    take(count: number): GuessCollection {
        return new GuessCollection(this.items.slice(0, count));
    }

    get bestTemperature(): number {
        if (this.isEmpty) return 0;
        return Math.max(...this.items.map((g) => g.temperature));
    }

    get words(): Set<string> {
        return new Set(this.items.map((g) => g.word.toLowerCase()));
    }

    get latestGuess(): Guess | null {
        if (this.isEmpty) return null;
        return this.items.reduce((latest, current) =>
            current.createdAt > latest.createdAt ? current : latest
        );
    }

    map<T>(fn: (guess: Guess) => T): T[] {
        return this.items.map(fn);
    }
}

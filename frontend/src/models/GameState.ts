import type { Room } from "./Room";
import type { Guess } from "./Guess";
import { GuessCollection } from "./GuessCollection";

/**
 * Encapsulates the derived game state, centralizing logic that was
 * previously scattered across GameScreen.tsx and useRoom.ts.
 * 
 * Access room properties directly via `gameState.room.xxx` for simple proxies.
 */
export class GameState {
    readonly room: Room;
    readonly currentPlayerId: string;
    private readonly collection: GuessCollection;

    constructor(room: Room, guesses: Guess[], currentPlayerId: string) {
        this.room = room;
        this.currentPlayerId = currentPlayerId;
        this.collection = GuessCollection.from(guesses);
    }

    // --- Mode helpers (kept for boolean convenience) ---

    get isCoopMode(): boolean {
        return this.room.mode === "coop";
    }

    get isJcjMode(): boolean {
        return this.room.mode === "jcj";
    }

    // --- Guess collections ---

    get allGuesses(): GuessCollection {
        return this.collection;
    }

    get myGuesses(): GuessCollection {
        return this.collection.byPlayer(this.currentPlayerId);
    }

    get myGuessesByTemperature(): Guess[] {
        return this.myGuesses.sortedBy("temperature").items;
    }

    get allGuessesByTemperature(): Guess[] {
        return this.collection.sortedBy("temperature").items;
    }

    get latestGuessesByTemperature(): Guess[] {
        return this.collection.latest(20).sortedBy("temperature").items;
    }

    get barGuesses(): Guess[] {
        const source = this.isJcjMode ? this.myGuesses : this.collection;
        return source.sortedBy("time", "asc").items;
    }

    // --- Best temperatures ---

    get displayedBestTemperature(): number {
        return this.isJcjMode
            ? this.myGuesses.bestTemperature
            : this.collection.bestTemperature;
    }

    get latestGuess(): Guess | null {
        return this.myGuesses.latestGuess;
    }

    // --- Blocked words ---

    get blockedWords(): Set<string> {
        return this.isCoopMode
            ? this.collection.words
            : this.myGuesses.words;
    }

    // --- Display helpers ---

    get shouldRevealAllWords(): boolean {
        return this.isCoopMode || this.room.isWon;
    }
}

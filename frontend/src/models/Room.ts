export interface RoomData {
    id: string;
    code: string;
    status: "active" | "finished";
    revealed_word: string | null;
    created_at: string;
}

export class Room {
    readonly id: string;
    readonly code: string;
    readonly status: "active" | "finished";
    readonly revealedWord: string | null;
    readonly createdAt: Date;

    constructor(data: RoomData) {
        this.id = data.id;
        this.code = data.code;
        this.status = data.status;
        this.revealedWord = data.revealed_word;
        this.createdAt = new Date(data.created_at);
    }

    static fromApi(data: RoomData): Room {
        return new Room(data);
    }

    get isFinished(): boolean {
        return this.status === "finished";
    }

    get isActive(): boolean {
        return this.status === "active";
    }

    get isWon(): boolean {
        return this.revealedWord !== null;
    }

    getShareUrl(baseUrl: string = window.location.origin): string {
        return `${baseUrl}?room=${this.code}`;
    }

    withRevealedWord(word: string): Room {
        return new Room({
            id: this.id,
            code: this.code,
            status: "finished",
            revealed_word: word,
            created_at: this.createdAt.toISOString(),
        });
    }
}

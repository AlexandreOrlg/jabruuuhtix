export interface Room {
    id: string;
    code: string;
    status: "active" | "finished";
    revealed_word: string | null;
    mode: "coop" | "jcj";
    created_at: string;
}

export interface Guess {
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

export interface Player {
    id: string;
    name: string;
    joinedAt: string;
}

export interface CreateRoomResponse {
    room: Room;
}

export interface SubmitGuessResponse {
    guessId: string;
    roomId: string;
    word: string;
    score: number;
    rank: number | null;
    temperature: number;
    createdAt: string;
    revealedWord: string | null;
}

export interface Room {
    id: string;
    code: string;
    status: "active" | "finished";
    revealed_word: string | null;
    created_at: string;
}

export interface Guess {
    id: string;
    room_id: string;
    player_id: string;
    player_name: string;
    word: string;
    score: number;
    created_at: string;
}

export interface CreateRoomResponse {
    roomId: string;
    roomCode: string;
    createdAt: string;
}

export interface SubmitGuessResponse {
    guessId: string;
    roomId: string;
    word: string;
    score: number;
    createdAt: string;
    revealedWord: string | null;
}

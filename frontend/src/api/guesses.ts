import { supabase } from "@/lib/supabase";
import type { SubmitGuessResponse } from "@/lib/types";
import type { GuessData } from "@/models/Guess";
import { Guess } from "@/models/Guess";
import { apiFetch } from "./client";

interface SubmitGuessParams {
    roomCode: string;
    playerId: string;
    playerName: string;
    word: string;
}

export async function fetchGuessesByRoomId(roomId: string): Promise<Guess[]> {
    const { data, error } = await supabase
        .from("guesses")
        .select("*")
        .eq("room_id", roomId)
        .order("score", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((guess) => Guess.fromApi(guess as GuessData));
}

export async function submitGuess(
    params: SubmitGuessParams
): Promise<SubmitGuessResponse> {
    return apiFetch<SubmitGuessResponse>("/api/guesses", {
        method: "POST",
        body: JSON.stringify(params),
    });
}

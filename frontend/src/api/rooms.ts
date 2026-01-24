import { supabase } from "@/lib/supabase";
import type { CreateRoomResponse } from "@/lib/types";
import type { GuessData } from "@/models/Guess";
import { Guess } from "@/models/Guess";
import type { RoomData, RoomMode } from "@/models/Room";
import { Room } from "@/models/Room";
import { apiFetch } from "./client";

export async function fetchRoomById(roomId: string): Promise<Room> {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

    if (error || !data) {
        if (error?.code === "PGRST116") {
            throw new Error("Room not found");
        }
        throw error ?? new Error("Room not found");
    }

    return Room.fromApi(data as RoomData);
}

export async function fetchRoomByCode(roomCode: string): Promise<Room | null> {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode.toUpperCase())
        .single();

    if (error || !data) {
        return null;
    }

    return Room.fromApi(data as RoomData);
}

export async function createRoom(
    playerName: string,
    mode: RoomMode
): Promise<Room> {
    const response = await apiFetch<CreateRoomResponse>("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ playerName, mode }),
    });

    return Room.fromApi(response.room as RoomData);
}

export async function fetchRoomWithGuessesByCode(
    roomCode: string
): Promise<{ room: Room; guesses: Guess[] }> {
    const { data, error } = await supabase
        .from("rooms")
        .select("*, guesses(*)")
        .eq("code", roomCode.toUpperCase())
        .single();

    if (error || !data) {
        throw error ?? new Error("Room not found");
    }

    const room = Room.fromApi(data as RoomData);
    const guesses = (data.guesses ?? []).map((guess: GuessData) =>
        Guess.fromApi(guess)
    );

    return { room, guesses };
}

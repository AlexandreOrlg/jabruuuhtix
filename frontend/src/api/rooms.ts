import { supabase } from "@/lib/supabase";
import type { CreateRoomResponse } from "@/lib/types";
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

    return fetchRoomById(response.roomId);
}

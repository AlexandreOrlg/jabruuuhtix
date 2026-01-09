import { Input } from "@/components/ui/8bit/input";
import type { ChangeEvent } from "react";

interface RoomCodeFormProps {
    roomCode: string;
    onRoomCodeChange: (code: string) => void;
}

export function RoomCodeForm({
    roomCode,
    onRoomCodeChange,
}: RoomCodeFormProps) {
    return (
        <div>
            <label className="block text-sm text-gray-300 mb-1">
                Code de la salle
            </label>
            <Input
                type="text"
                placeholder="ABC123"
                value={roomCode}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onRoomCodeChange(event.target.value.toUpperCase())
                }
                maxLength={6}
            />
        </div>
    );
}

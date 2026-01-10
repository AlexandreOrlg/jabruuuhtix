import { Button } from "@/components/ui/8bit/button";
import type { RoomMode } from "@/models/Room";

interface GameHeaderProps {
    roomCode: string;
    roomMode: RoomMode;
    onLeaveRoom: () => void;
}

export function GameHeader({ roomCode, roomMode, onLeaveRoom }: GameHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={onLeaveRoom}>
                ← Quitter
            </Button>
            <div className="text-center retro">
                <div className="text-xs text-gray-400">Code de la salle</div>
                <div className="text-2xl tracking-widest">{roomCode}</div>
            </div>
            <div className="text-right retro">
                <div className="text-xs text-gray-400">Mode</div>
                <div className="text-lg">{roomMode === "jcj" ? "JCJ" : "COOP"}</div>
            </div>
        </div>
    );
}

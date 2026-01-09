import { Button } from "@/components/ui/8bit/button";

interface GameHeaderProps {
    roomCode: string;
    onLeaveRoom: () => void;
}

export function GameHeader({ roomCode, onLeaveRoom }: GameHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={onLeaveRoom}>
                ← Quitter
            </Button>
            <div className="text-center retro">
                <div className="text-xs text-gray-400">Code de la salle</div>
                <div className="text-2xl tracking-widest">{roomCode}</div>
            </div>
        </div>
    );
}

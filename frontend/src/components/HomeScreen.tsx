import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";

interface HomeScreenProps {
    playerName: string;
    onPlayerNameChange: (name: string) => void;
    onCreateRoom: () => Promise<void>;
    onJoinRoom: (code: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function HomeScreen({
    playerName,
    onPlayerNameChange,
    onCreateRoom,
    onJoinRoom,
    isLoading,
    error,
}: HomeScreenProps) {
    const [roomCode, setRoomCode] = useState("");
    const [mode, setMode] = useState<"main" | "join">("main");

    const handleCreateRoom = async () => {
        if (!playerName.trim()) return;
        await onCreateRoom();
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim() || !roomCode.trim()) return;
        await onJoinRoom(roomCode.toUpperCase());
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1
                        className="retro text-4xl md:text-5xl font-bold text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                        style={{ textShadow: "5px 5px 0 #000, -1px -1px 0 #000" }}
                    >
                        🎮 Jabruuuhtix
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">
                            {mode === "main" ? "Bienvenue !" : "Rejoindre une salle"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Player name input */}
                        <div>
                            <label className="block text-sm mb-1">Pseudo</label>
                            <Input
                                type="text"
                                placeholder="Votre pseudo..."
                                value={playerName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    onPlayerNameChange(e.target.value)
                                }
                                maxLength={32}
                            />
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="p-3 bg-red-900/50 border border-red-500 text-red-300 text-sm rounded">
                                {error}
                            </div>
                        )}

                        {mode === "main" ? (
                            <div className="flex flex-col gap-2 mt-8">
                                {/* Create room button */}
                                <Button
                                    onClick={handleCreateRoom}
                                    disabled={isLoading || !playerName.trim()}
                                    className="w-full"
                                >
                                    {isLoading ? "Création..." : "🎲 Créer une salle"}
                                </Button>

                                {/* Join room button */}
                                <Button
                                    onClick={() => setMode("join")}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full"
                                >
                                    🚪 Rejoindre une salle
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 mt-8">
                                {/* Room code input */}
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">
                                        Code de la salle
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="ABC123"
                                        value={roomCode}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setRoomCode(e.target.value.toUpperCase())
                                        }
                                        maxLength={6}
                                    />
                                </div>

                                {/* Join button */}
                                <Button
                                    onClick={handleJoinRoom}
                                    disabled={isLoading || !playerName.trim() || !roomCode.trim()}
                                    className="w-full"
                                >
                                    {isLoading ? "Connexion..." : "🎮 Rejoindre"}
                                </Button>

                                {/* Back button */}
                                <Button
                                    onClick={() => setMode("main")}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full"
                                >
                                    ← Retour
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

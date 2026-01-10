import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { PlayerNameForm } from "./PlayerNameForm";
import { RoomCodeForm } from "./RoomCodeForm";
import type { RoomMode } from "@/models/Room";

interface HomeScreenProps {
    playerName: string;
    onPlayerNameChange: (name: string) => void;
    onCreateRoom: (mode: RoomMode) => Promise<void>;
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
    const [screenMode, setScreenMode] = useState<"main" | "join">("main");
    const [roomMode, setRoomMode] = useState<RoomMode>("coop");

    const handleCreateRoom = async () => {
        if (!playerName.trim()) return;
        await onCreateRoom(roomMode);
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim() || !roomCode.trim()) return;
        await onJoinRoom(roomCode.toUpperCase());
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <img
                        src="/favicon.svg"
                        alt="Jabruuuhtix"
                        className="mx-auto mb-1 h-32"
                    />
                    <h1
                        className="retro text-4xl md:text-5xl font-bold text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                        style={{ textShadow: "5px 5px 0 #000, -1px -1px 0 #000" }}
                    >
                        Jabruuuhtix
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">
                            {screenMode === "main" ? "Bienvenue !" : "Rejoindre une salle"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <PlayerNameForm
                            playerName={playerName}
                            onPlayerNameChange={onPlayerNameChange}
                        />

                        {error && (
                            <div className="p-3 bg-red-900/50 border border-red-500 text-red-300 text-sm rounded">
                                {error}
                            </div>
                        )}

                        {screenMode === "main" ? (
                            <div className="flex flex-col gap-2 mt-8">
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-400 retro">
                                        Mode de jeu
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={roomMode === "coop" ? "default" : "outline"}
                                            onClick={() => setRoomMode("coop")}
                                            disabled={isLoading}
                                        >
                                            COOP
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={roomMode === "jcj" ? "default" : "outline"}
                                            onClick={() => setRoomMode("jcj")}
                                            disabled={isLoading}
                                        >
                                            JCJ
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCreateRoom}
                                    disabled={isLoading || !playerName.trim()}
                                    className="w-full"
                                >
                                    {isLoading ? "Création..." : "🎲 Créer une salle"}
                                </Button>

                                <Button
                                    onClick={() => setScreenMode("join")}
                                    disabled={isLoading}
                                    variant="outline"
                                    className="w-full"
                                >
                                    🚪 Rejoindre une salle
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 mt-8">
                                <RoomCodeForm
                                    roomCode={roomCode}
                                    onRoomCodeChange={setRoomCode}
                                />

                                <Button
                                    onClick={handleJoinRoom}
                                    disabled={
                                        isLoading || !playerName.trim() || !roomCode.trim()
                                    }
                                    className="w-full"
                                >
                                    {isLoading ? "Connexion..." : "🎮 Rejoindre"}
                                </Button>

                                <Button
                                    onClick={() => setScreenMode("main")}
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

import { Guess } from "@/models/Guess";
import { Card, CardContent } from "@/components/ui/8bit/card";
import type { PlayerSummary } from "@/hooks/usePlayers";

interface PlayerSidebarProps {
    players: PlayerSummary[];
}

export function PlayerSidebar({ players }: PlayerSidebarProps) {
    return (
        <aside className="w-64 p-4 hidden md:block sticky top-0">
            <h2 className="retro text-lg mb-4">Joueurs ({players.length})</h2>
            <div className="space-y-2">
                {players.map((player) => (
                    <Card
                        key={player.id}
                        className={`${player.isCurrent && "[&>div]:!border-red-300 !border-red-300"} p-4`}
                    >
                        <div className="font-medium truncate">
                            {player.displayName}
                            {player.isCurrent && " (vous)"}
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-400">{player.guessCount} essais</span>
                            <span className={Guess.getScoreColor(player.bestScore)}>
                                {player.bestScore}%
                            </span>
                        </div>
                    </Card>
                ))}
                {players.length === 0 && (
                    <div className="text-gray-500 text-sm">
                        Aucun joueur pour l'instant...
                    </div>
                )}
            </div>
        </aside>
    );
}

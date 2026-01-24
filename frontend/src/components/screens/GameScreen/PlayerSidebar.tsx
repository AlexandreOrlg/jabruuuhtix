import { cn } from "@/lib/utils";
import { Guess } from "@/models/Guess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/8bit/card";
import type { PlayerSummary } from "@/hooks/usePlayers";

interface PlayerSidebarProps {
    players: PlayerSummary[];
}

function PlayerItem({ player }: { player: PlayerSummary }) {
    const attemptsLabel = player.guessCount === 1 ? "essai" : "essais";

    return (
        <div
            className={cn(
                "border-b-2 border-foreground dark:border-ring",
                player.isCurrent && "bg-red-500/10"
            )}
        >
            <div className="flex items-center justify-between gap-3 py-3 px-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                        {player.displayName}
                        {player.isCurrent && " (vous)"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                            {player.guessCount} {attemptsLabel}
                        </span>
                        <span className={cn("font-semibold", Guess.getTemperatureColor(player.bestScore))}>
                            {player.bestScore}%
                        </span>
                    </div>
                </div>

                {player.isCurrent && (
                    <span className="text-[9px] border-2 border-foreground dark:border-ring px-2 py-0.5">
                        VOUS
                    </span>
                )}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

export function PlayerSidebar({ players }: PlayerSidebarProps) {
    return (
        <aside className="w-64 p-4 hidden md:block sticky top-0">
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                        Joueurs
                        <span className="text-[9px] border-2 border-foreground dark:border-ring px-2 py-0.5">
                            {players.length}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {players.length === 0 ? (
                        <EmptyState message="Aucun joueur pour l'instant..." />
                    ) : (
                        <div className="max-h-[420px] overflow-y-auto">
                            {players.map((player) => (
                                <PlayerItem key={player.id} player={player} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </aside>
    );
}

import { useMemo } from "react";
import { GameState } from "@/models/GameState";
import type { Room } from "@/models/Room";
import type { Guess } from "@/models/Guess";
import type { PlayerPresenceData } from "@/models/Player";
import { PlayerWithStats } from "@/models/Player";
import { GameHeader } from "./GameHeader";
import { TemperatureCard } from "./TemperatureCard";
import { VictoryBanner } from "./VictoryBanner";
import { GuessForm } from "./GuessForm";
import { GuessesTable } from "./GuessesTable";
import { PlayerSidebar } from "./PlayerSidebar";

interface GameScreenProps {
    room: Room;
    guesses: Guess[];
    presentPlayers: PlayerPresenceData[];
    playerId: string;
    submittedWords: Set<string>;
    guessValidationPulse: number;
    onSubmitGuess: (word: string) => Promise<{ score: number } | null>;
    onLeaveRoom: () => void;
    isLoading: boolean;
}

interface TableConfig {
    title: string;
    guesses: Guess[];
    revealAllWords: boolean;
}

export function GameScreen({
    room,
    guesses,
    presentPlayers,
    playerId,
    submittedWords,
    guessValidationPulse,
    onSubmitGuess,
    onLeaveRoom,
    isLoading,
}: GameScreenProps) {
    const gameState = useMemo(
        () => new GameState(room, guesses, playerId),
        [room, guesses, playerId]
    );

    const players = useMemo(
        () => PlayerWithStats.fromPresenceAndGuesses(presentPlayers, guesses, playerId),
        [presentPlayers, guesses, playerId]
    );

    const blockedWords = useMemo(() => {
        return gameState.isCoopMode ? gameState.blockedWords : submittedWords;
    }, [gameState, submittedWords]);

    // Config-driven table layout - avoids duplicating grid structure
    const tableConfigs: TableConfig[] = gameState.isJcjMode
        ? [
            { title: "Mes propositions", guesses: gameState.myGuessesByTemperature, revealAllWords: true },
            { title: "Toutes les propositions", guesses: gameState.allGuessesByTemperature, revealAllWords: gameState.shouldRevealAllWords },
        ]
        : [
            { title: "Toutes les propositions", guesses: gameState.allGuessesByTemperature, revealAllWords: gameState.shouldRevealAllWords },
            { title: "Dernières propositions", guesses: gameState.latestGuessesByTemperature, revealAllWords: true },
        ];

    return (
        <div className="min-h-screen flex overflow-auto h-full">
            <PlayerSidebar players={players} />

            <div className="p-4 w-full">
                <div className="w-full mx-auto pb-32">
                    <div className="sticky top-4 bg-[#151515] pb-2 z-10">
                        <GameHeader
                            roomCode={room.code}
                            roomMode={room.mode}
                            onLeaveRoom={onLeaveRoom}
                        />

                        <div className="mb-4">
                            <TemperatureCard
                                bestTemperature={gameState.displayedBestTemperature}
                                barGuesses={gameState.barGuesses}
                            />
                        </div>

                        {room.revealedWord ? (
                            <VictoryBanner revealedWord={room.revealedWord} />
                        ) : (
                            <GuessForm
                                isLoading={isLoading}
                                blockedWords={blockedWords}
                                validationPulse={guessValidationPulse}
                                onSubmitGuess={onSubmitGuess}
                            />
                        )}

                        <div className="text-center flex retro gap-8 items-center justify-start">
                            <div className="mt-3 text-xs text-gray-400">Dernière soumission : </div>
                            {gameState.latestGuess ? (
                                <div className="flex items-center justify-center gap-2 text-sm">
                                    <span className="font-medium truncate max-w-[140px]">
                                        {gameState.latestGuess.word}
                                    </span>
                                    <span className={gameState.latestGuess.temperatureColor}>
                                        {gameState.latestGuess.temperatureEmoji} {gameState.latestGuess.formattedTemperature}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 mt-1">
                                    Aucune proposition pour l'instant
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Config-driven grid rendering */}
                    <div className="mt-8 grid grid-cols-2 gap-2 retro">
                        {tableConfigs.map((config) => (
                            <div key={config.title} className="w-full min-w-0 overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">{config.title}</h3>
                                <GuessesTable
                                    guesses={config.guesses}
                                    playerId={playerId}
                                    revealAllWords={config.revealAllWords}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

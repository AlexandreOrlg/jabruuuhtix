import { useMemo } from "react";
import { Guess } from "@/models/Guess";
import type { PlayerData } from "@/models/Player";
import type { RoomMode } from "@/models/Room";
import { usePlayers } from "@/hooks/usePlayers";
import { GameHeader } from "./GameHeader";
import { TemperatureCard } from "./TemperatureCard";
import { VictoryBanner } from "./VictoryBanner";
import { GuessForm } from "./GuessForm";
import { GuessesTable } from "./GuessesTable";
import { PlayerSidebar } from "./PlayerSidebar";

interface GameScreenProps {
    roomCode: string;
    guesses: Guess[];
    presentPlayers: PlayerData[];
    roomMode: RoomMode;
    revealedWord: string | null;
    playerId: string;
    submittedWords: Set<string>;
    onSubmitGuess: (word: string) => Promise<{ score: number } | null>;
    onLeaveRoom: () => void;
    isLoading: boolean;
    error: string | null;
}

export function GameScreen({
    roomCode,
    guesses,
    presentPlayers,
    roomMode,
    revealedWord,
    playerId,
    submittedWords,
    onSubmitGuess,
    onLeaveRoom,
    isLoading,
    error,
}: GameScreenProps) {
    const players = usePlayers(guesses, playerId, presentPlayers);
    const isJcjMode = roomMode === "jcj";
    const { myGuesses, displayedBestTemperature, lastGuess } = useMemo(() => {
        const playerGuesses = guesses.filter((guess) => guess.belongsTo(playerId));
        let latestGuess: Guess | null = null;
        for (const guess of playerGuesses) {
            if (!latestGuess || guess.createdAt > latestGuess.createdAt) {
                latestGuess = guess;
            }
        }

        return {
            myGuesses: isJcjMode ? playerGuesses : [],
            displayedBestTemperature: isJcjMode
                ? Guess.getBestTemperature(playerGuesses)
                : Guess.getBestTemperature(guesses),
            lastGuess: latestGuess,
        };
    }, [guesses, isJcjMode, playerId]);
    const revealAllWords = roomMode === "coop" || Boolean(revealedWord);
    const blockedWords = useMemo(() => {
        if (roomMode === "coop") {
            return new Set(guesses.map((guess) => guess.word.toLowerCase()));
        }
        return submittedWords;
    }, [guesses, roomMode, submittedWords]);

    return (
        <div className="min-h-screen flex overflow-auto h-full">
            <PlayerSidebar players={players} />

            <div className="flex-1 p-4">
                <div className={isJcjMode ? "w-full mx-auto" : "max-w-2xl mx-auto"}>
                    <GameHeader
                        roomCode={roomCode}
                        roomMode={roomMode}
                        onLeaveRoom={onLeaveRoom}
                    />

                    <TemperatureCard
                        bestTemperature={displayedBestTemperature}
                        lastGuess={lastGuess}
                    />

                    {revealedWord && (
                        <VictoryBanner revealedWord={revealedWord} />
                    )}

                    {!revealedWord && (
                        <GuessForm
                            isLoading={isLoading}
                            blockedWords={blockedWords}
                            onSubmitGuess={onSubmitGuess}
                        />
                    )}

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/50 border border-red-500 text-red-300 text-sm rounded">
                            {error}
                        </div>
                    )}

                    {isJcjMode ? (
                        <div className="mt-8 grid grid-cols-2 gap-6 retro">
                            <div className="w-full overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">Mes propositions</h3>
                                <GuessesTable
                                    guesses={myGuesses}
                                    playerId={playerId}
                                    revealAllWords={true}
                                />
                            </div>
                            <div className="w-full overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">Toutes les propositions</h3>
                                <GuessesTable
                                    guesses={guesses}
                                    playerId={playerId}
                                    revealAllWords={revealAllWords}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 w-full [&>div]:w-full">
                            <GuessesTable
                                guesses={guesses}
                                playerId={playerId}
                                revealAllWords={revealAllWords}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

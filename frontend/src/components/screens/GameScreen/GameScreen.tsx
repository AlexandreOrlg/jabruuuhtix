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
    guessValidationPulse: number;
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
    guessValidationPulse,
    onSubmitGuess,
    onLeaveRoom,
    isLoading,
}: GameScreenProps) {
    const players = usePlayers(guesses, playerId, presentPlayers);
    const isJcjMode = roomMode === "jcj";
    const {
        myGuessesByTemp,
        displayedBestTemperature,
        lastGuess,
        guessesByTemp,
        latestGuessesByTemp,
        barGuesses,
    } = useMemo(() => {
        const playerGuesses = guesses.filter((guess) => guess.belongsTo(playerId));
        let latestGuess: Guess | null = null;
        for (const guess of playerGuesses) {
            if (!latestGuess || guess.createdAt > latestGuess.createdAt) {
                latestGuess = guess;
            }
        }

        const sortByTemperature = (items: Guess[]) =>
            [...items].sort((a, b) => {
                if (b.temperature !== a.temperature) {
                    return b.temperature - a.temperature;
                }
                return b.createdAt.getTime() - a.createdAt.getTime();
            });
        const sortByTimeAsc = (items: Guess[]) =>
            [...items].sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            );

        const latestGuesses = [...guesses]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 20);

        return {
            myGuessesByTemp: sortByTemperature(playerGuesses),
            displayedBestTemperature: isJcjMode
                ? Guess.getBestTemperature(playerGuesses)
                : Guess.getBestTemperature(guesses),
            lastGuess: latestGuess,
            guessesByTemp: sortByTemperature(guesses),
            latestGuessesByTemp: sortByTemperature(latestGuesses),
            barGuesses: isJcjMode
                ? sortByTimeAsc(playerGuesses)
                : sortByTimeAsc(guesses),
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
        <div className="min-h-screen flex overflow-auto h-full ">
            <PlayerSidebar players={players} />

            <div className="p-4 w-full">
                <div className="w-full mx-auto pb-32  ">
                    <div className="sticky top-4 bg-[#151515] pb-2 z-10">
                        <GameHeader
                            roomCode={roomCode}
                            roomMode={roomMode}
                            onLeaveRoom={onLeaveRoom}
                        />


                        <div className="mb-4">
                            <TemperatureCard
                                bestTemperature={displayedBestTemperature}
                                barGuesses={barGuesses}
                            />
                        </div>

                        {revealedWord ? (
                            <VictoryBanner revealedWord={revealedWord} />
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
                            {lastGuess ? (
                                <div className="flex items-center justify-center gap-2 text-sm">
                                    <span className="font-medium truncate max-w-[140px]">
                                        {lastGuess.word}
                                    </span>
                                    <span className={lastGuess.temperatureColor}>
                                        {lastGuess.temperatureEmoji} {lastGuess.formattedTemperature}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 mt-1">
                                    Aucune proposition pour l'instant
                                </div>
                            )}
                        </div>
                    </div>

                    {isJcjMode ? (
                        <div className="mt-8 grid grid-cols-2 gap-2 retro">
                            <div className="w-full min-w-0 overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">Mes propositions</h3>
                                <GuessesTable
                                    guesses={myGuessesByTemp}
                                    playerId={playerId}
                                    revealAllWords={true}
                                />
                            </div>
                            <div className="w-full min-w-0 overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">Toutes les propositions</h3>
                                <GuessesTable
                                    guesses={guessesByTemp}
                                    playerId={playerId}
                                    revealAllWords={revealAllWords}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 grid grid-cols-2 gap-2 retro">
                            <div className="w-full min-w-0 overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">Toutes les propositions</h3>
                                <GuessesTable
                                    guesses={guessesByTemp}
                                    playerId={playerId}
                                    revealAllWords={revealAllWords}
                                />
                            </div>
                            <div className="w-full min-w-0 overflow-hidden [&>div]:w-full px-2">
                                <h3 className="text-lg font-semibold mb-4 text-center">Dernières propositions</h3>
                                <GuessesTable
                                    guesses={latestGuessesByTemp}
                                    playerId={playerId}
                                    revealAllWords={true}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { Guess } from "@/models/Guess";
import type { PlayerData } from "@/models/Player";
import type { RoomMode } from "@/models/Room";
import { usePlayers } from "@/hooks/usePlayers";
import { GameHeader } from "./GameHeader";
import { ScoreCard } from "./ScoreCard";
import { VictoryBanner } from "./VictoryBanner";
import { GuessForm } from "./GuessForm";
import { GuessesTable } from "./GuessesTable";
import { PlayerSidebar } from "./PlayerSidebar";

interface GameScreenProps {
    roomCode: string;
    guesses: Guess[];
    presentPlayers: PlayerData[];
    roomMode: RoomMode;
    bestScore: number;
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
    bestScore,
    revealedWord,
    playerId,
    submittedWords,
    onSubmitGuess,
    onLeaveRoom,
    isLoading,
    error,
}: GameScreenProps) {
    const players = usePlayers(guesses, playerId, presentPlayers);
    const revealAllWords = roomMode === "coop" || Boolean(revealedWord);
    const displayedBestScore =
        roomMode === "jcj"
            ? Guess.getBestScore(guesses.filter((guess) => guess.belongsTo(playerId)))
            : bestScore;

    return (
        <div className="min-h-screen flex overflow-auto h-full">
            <PlayerSidebar players={players} />

            <div className="flex-1 p-4">
                <div className="max-w-2xl mx-auto">
                    <GameHeader
                        roomCode={roomCode}
                        roomMode={roomMode}
                        onLeaveRoom={onLeaveRoom}
                    />

                    <ScoreCard bestScore={displayedBestScore} />

                    {revealedWord && (
                        <VictoryBanner revealedWord={revealedWord} />
                    )}

                    {!revealedWord && (
                        <GuessForm
                            isLoading={isLoading}
                            submittedWords={submittedWords}
                            onSubmitGuess={onSubmitGuess}
                        />
                    )}

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/50 border border-red-500 text-red-300 text-sm rounded">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 w-full [&>div]:w-full">
                        <GuessesTable
                            guesses={guesses}
                            playerId={playerId}
                            revealAllWords={revealAllWords}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

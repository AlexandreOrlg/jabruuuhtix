import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
    Card,
    CardContent,
} from "@/components/ui/8bit/card";
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";
import { Badge } from "@/components/ui/8bit/badge";
import { Progress } from "@/components/ui/8bit/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/8bit/table";
import type { Guess } from "@/lib/types";

interface GameScreenProps {
    roomCode: string;
    guesses: Guess[];
    bestScore: number;
    revealedWord: string | null;
    playerId: string;
    onSubmitGuess: (word: string) => Promise<{ score: number } | null>;
    onLeaveRoom: () => void;
    isLoading: boolean;
    error: string | null;
}

export function GameScreen({
    roomCode,
    guesses,
    bestScore,
    revealedWord,
    playerId,
    onSubmitGuess,
    onLeaveRoom,
    isLoading,
    error,
}: GameScreenProps) {
    const [word, setWord] = useState("");
    const [lastScore, setLastScore] = useState<number | null>(null);
    const [submittedWords, setSubmittedWords] = useState<Set<string>>(new Set());

    // Track submitted words from this player
    useEffect(() => {
        const playerWords = guesses
            .filter((g) => g.player_id === playerId)
            .map((g) => g.word.toLowerCase());
        setSubmittedWords(new Set(playerWords));
    }, [guesses, playerId]);

    // Trigger confetti on victory
    useEffect(() => {
        if (revealedWord) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, [revealedWord]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedWord = word.toLowerCase().trim();

        if (!normalizedWord) return;

        // Check if already submitted
        if (submittedWords.has(normalizedWord)) {
            return;
        }

        const result = await onSubmitGuess(normalizedWord);
        if (result) {
            setLastScore(result.score);
            setWord("");
        }
    };

    const isWordSubmitted = submittedWords.has(word.toLowerCase().trim());

    // Get score color
    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-400";
        if (score >= 60) return "text-yellow-400";
        if (score >= 40) return "text-orange-400";
        return "text-red-400";
    };

    const getScoreBadgeVariant = (
        score: number
    ): "default" | "destructive" | "outline" | "secondary" => {
        if (score >= 80) return "default";
        if (score >= 60) return "secondary";
        return "outline";
    };

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <Button
                        variant="outline"
                        onClick={onLeaveRoom}
                    >
                        ← Quitter
                    </Button>
                    <div className="text-center retro">
                        <div className="text-xs text-gray-400">Code de la salle</div>
                        <div className="text-2xl tracking-widest">
                            {roomCode}
                        </div>
                    </div>
                </div>

                {/* Best score card */}
                <Card className="mb-6 bg-gray-900/80 border-cyan-400">
                    <CardContent className="py-4">
                        <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">Meilleur score</div>
                            <div className={`text-5xl font-bold ${getScoreColor(bestScore)}`}>
                                {bestScore}%
                            </div>
                            <Progress value={bestScore} className="mt-3 h-4" />
                        </div>
                    </CardContent>
                </Card>

                {/* Victory banner */}
                {revealedWord && (
                    <Card className="mb-6 bg-green-900/50 border-green-400">
                        <CardContent className="py-6 text-center">
                            <div className="text-2xl mb-2">🎉 VICTOIRE ! 🎉</div>
                            <div className="text-3xl font-bold text-green-400 uppercase">
                                {revealedWord}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Word input form */}
                {!revealedWord && (
                    <>
                        <form onSubmit={handleSubmit} className="flex gap-6 w-full">
                            <Input
                                type="text"
                                placeholder="Proposez un mot..."
                                value={word}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setWord(e.target.value)
                                }

                                className="w-full"
                                disabled={isLoading}
                                autoFocus
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !word.trim() || isWordSubmitted}
                            >
                                {isLoading ? "..." : "→"}
                            </Button>
                        </form>
                        {isWordSubmitted && word.trim() && (
                            <div className="text-xs text-yellow-400 mt-2">
                                Vous avez déjà proposé ce mot
                            </div>
                        )}
                    </>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-900/50 border border-red-500 text-red-300 text-sm rounded">
                        {error}
                    </div>
                )}

                {/* Guesses table */}
                <div className="mt-8 w-full [&>div]:w-full">
                    {guesses.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            Aucune proposition pour l'instant...
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Proposition</TableHead>
                                    <TableHead>Auteur</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody >
                                {guesses.map((guess) => (
                                    <TableRow
                                        key={guess.id}
                                        className={guess.player_id === playerId ? "bg-primary/10" : ""}
                                    >
                                        <TableCell className="font-medium">
                                            {guess.word}
                                        </TableCell>
                                        <TableCell>
                                            {guess.player_name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                className={getScoreColor(guess.score)}
                                            >
                                                {guess.score}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
}

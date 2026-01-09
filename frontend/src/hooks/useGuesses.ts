import { useCallback, useMemo, useState } from "react";
import { Guess } from "@/models/Guess";

interface UseGuessesReturn {
    guesses: Guess[];
    submittedWords: Set<string>;
    addGuess: (guess: Guess) => void;
    replaceGuesses: (guesses: Guess[]) => void;
    clearGuesses: () => void;
}

export function useGuesses(playerId: string): UseGuessesReturn {
    const [guesses, setGuesses] = useState<Guess[]>([]);

    const addGuess = useCallback((guess: Guess) => {
        setGuesses((prev) => {
            if (prev.some((existing) => existing.id === guess.id)) return prev;
            return Guess.sortByScore([...prev, guess]);
        });
    }, []);

    const replaceGuesses = useCallback((nextGuesses: Guess[]) => {
        setGuesses(Guess.sortByScore(nextGuesses));
    }, []);

    const clearGuesses = useCallback(() => {
        setGuesses([]);
    }, []);

    const submittedWords = useMemo(() => {
        if (!playerId) return new Set<string>();
        return Guess.getPlayerWords(guesses, playerId);
    }, [guesses, playerId]);

    return {
        guesses,
        submittedWords,
        addGuess,
        replaceGuesses,
        clearGuesses,
    };
}

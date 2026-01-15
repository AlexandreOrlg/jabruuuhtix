import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";

interface GuessFormProps {
    isLoading: boolean;
    blockedWords: Set<string>;
    onSubmitGuess: (word: string) => Promise<{ score: number } | null>;
}

export function GuessForm({ isLoading, blockedWords, onSubmitGuess }: GuessFormProps) {
    const [word, setWord] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const normalizedWord = word.toLowerCase().trim();

        if (!normalizedWord) return;
        if (normalizedWord.length <= 2) return;
        if (blockedWords.has(normalizedWord)) return;

        const result = await onSubmitGuess(normalizedWord);
        if (result) {
            setHistory((prev) => [normalizedWord, ...prev]);
            setHistoryIndex(-1);
            setWord("");
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp" && history.length > 0) {
            event.preventDefault();
            const newIndex = Math.min(historyIndex + 1, history.length - 1);
            setHistoryIndex(newIndex);
            setWord(history[newIndex]);
        } else if (event.key === "ArrowDown" && historyIndex > -1) {
            event.preventDefault();
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setWord(newIndex === -1 ? "" : history[newIndex]);
        }
    };

    const normalizedWord = word.toLowerCase().trim();
    const isWordSubmitted = normalizedWord.length > 0 && blockedWords.has(normalizedWord);

    return (
        <>
            <form onSubmit={handleSubmit} className="flex gap-6 w-full">
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Proposez un mot..."
                    value={word}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setWord(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    className="w-full"
                    disabled={isLoading}
                    autoFocus
                />
                <Button
                    type="submit"
                    disabled={isLoading || !normalizedWord || isWordSubmitted}
                >
                    {isLoading ? "..." : "→"}
                </Button>
            </form>
            {isWordSubmitted && normalizedWord && (
                <div className="text-xs text-yellow-400 mt-2">
                    Ce mot a déjà été proposé
                </div>
            )}
        </>
    );
}

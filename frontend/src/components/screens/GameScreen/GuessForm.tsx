import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";
import { GAME_RULES } from "@/lib/constants";

interface GuessFormProps {
    isLoading: boolean;
    blockedWords: Set<string>;
    validationPulse: number;
    onSubmitGuess: (word: string) => Promise<{ score: number } | null>;
}

export function GuessForm({
    isLoading,
    blockedWords,
    validationPulse,
    onSubmitGuess,
}: GuessFormProps) {
    const [word, setWord] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [remoteInvalid, setRemoteInvalid] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (validationPulse === 0) return;
        setRemoteInvalid(true);
        setIsShaking(false);
        requestAnimationFrame(() => setIsShaking(true));
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [validationPulse]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const normalizedWord = word.toLowerCase().trim();

        if (!normalizedWord) return;
        if (normalizedWord.length < GAME_RULES.MIN_WORD_LENGTH) return;
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
    const isInvalid = remoteInvalid || isWordSubmitted;

    return (
        <>
            <form onSubmit={handleSubmit} className="flex gap-6 w-full">
                <div
                    className={`w-full ${isShaking ? "input-shake" : ""}`}
                    onAnimationEnd={() => setIsShaking(false)}
                >
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Proposez un mot..."
                        value={word}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            if (remoteInvalid) {
                                setRemoteInvalid(false);
                            }
                            setWord(event.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-full"
                        disabled={isLoading}
                        autoFocus
                        aria-invalid={isInvalid}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading || !normalizedWord || isWordSubmitted}
                >
                    {isLoading ? "..." : "→"}
                </Button>
            </form>
        </>
    );
}

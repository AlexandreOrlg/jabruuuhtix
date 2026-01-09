import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";

interface GuessFormProps {
    isLoading: boolean;
    submittedWords: Set<string>;
    onSubmitGuess: (word: string) => Promise<{ score: number } | null>;
}

export function GuessForm({ isLoading, submittedWords, onSubmitGuess }: GuessFormProps) {
    const [word, setWord] = useState("");

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const normalizedWord = word.toLowerCase().trim();

        if (!normalizedWord) return;
        if (submittedWords.has(normalizedWord)) return;

        const result = await onSubmitGuess(normalizedWord);
        if (result) {
            setWord("");
        }
    };

    const normalizedWord = word.toLowerCase().trim();
    const isWordSubmitted = normalizedWord.length > 0 && submittedWords.has(normalizedWord);

    return (
        <>
            <form onSubmit={handleSubmit} className="flex gap-6 w-full">
                <Input
                    type="text"
                    placeholder="Proposez un mot..."
                    value={word}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setWord(event.target.value)
                    }
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
                    Vous avez déjà proposé ce mot
                </div>
            )}
        </>
    );
}

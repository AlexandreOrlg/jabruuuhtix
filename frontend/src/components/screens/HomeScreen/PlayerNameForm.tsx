import { Input } from "@/components/ui/8bit/input";
import type { ChangeEvent } from "react";

interface PlayerNameFormProps {
    playerName: string;
    onPlayerNameChange: (name: string) => void;
}

export function PlayerNameForm({
    playerName,
    onPlayerNameChange,
}: PlayerNameFormProps) {
    return (
        <div>
            <label className="block text-sm mb-1">Pseudo</label>
            <Input
                type="text"
                placeholder="Votre pseudo..."
                value={playerName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onPlayerNameChange(event.target.value)
                }
                maxLength={32}
            />
        </div>
    );
}

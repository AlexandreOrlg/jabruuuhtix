import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/8bit/table";
import type { Guess } from "@/models/Guess";

interface GuessesTableProps {
    guesses: Guess[];
    playerId: string;
    revealAllWords: boolean;
}

export function GuessesTable({
    guesses,
    playerId,
    revealAllWords,
}: GuessesTableProps) {
    if (guesses.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                Aucune proposition pour l'instant...
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Proposition</TableHead>
                    <TableHead>Auteur</TableHead>
                    <TableHead className="text-right">Rang</TableHead>
                    <TableHead className="text-right">Temp.</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {guesses.map((guess) => (
                    <TableRow
                        key={guess.id}
                        className={guess.belongsTo(playerId) ? "bg-primary/10" : ""}
                    >
                        <TableCell className="font-medium">
                            {!revealAllWords && !guess.belongsTo(playerId)
                                ? "****"
                                : guess.word}
                        </TableCell>
                        <TableCell>{guess.playerName}</TableCell>
                        <TableCell className="text-right">
                            <span className="text-gray-400">
                                {guess.formattedRank}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                            <span className={guess.temperatureColor}>
                                {guess.temperatureEmoji} {guess.formattedTemperature}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
